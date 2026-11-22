// Teleprompter that follows your voice.
// Uses the browser's Web Speech API (Chrome / Edge) and fuzzy-matches what you
// say against the script, so small mis-hearings or skipped words don't stall it.

const LOOKAHEAD = 12;        // how many script words ahead a spoken word may match
const RESYNC_AHEAD = 120;    // window (in script words) searched to re-find your place
const RESYNC_BEHIND = 80;    // ...and backwards, if you go back to re-read a line

export function normalizeWord(word) {
  return word
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')       // strip Latin accents
    .replace(/[^\p{L}\p{M}\p{N}]/gu, '');  // keep letters, marks (Hindi matras), digits
}

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function similar(a, b) {
  if (a === b) return true;
  const min = Math.min(a.length, b.length);
  const max = Math.max(a.length, b.length);
  if (min < 3) return false;
  if (min >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  if (max - min > 2) return false;
  const allowed = max <= 4 ? 1 : max <= 8 ? 2 : 3;
  return editDistance(a, b) <= allowed;
}

// Indices of the first `seq.length` consecutive matchable units in [start, end)
// that match `seq`. Returns the unit index just after the match, or -1.
function findSequence(norm, seq, start, end) {
  const idx = [];
  for (let j = Math.max(0, start); j < Math.min(norm.length, end); j++) {
    if (norm[j]) idx.push(j);
  }
  outer:
  for (let k = 0; k + seq.length <= idx.length; k++) {
    for (let m = 0; m < seq.length; m++) {
      if (!similar(norm[idx[k + m]], seq[m])) continue outer;
    }
    return idx[k + seq.length - 1] + 1;
  }
  return -1;
}

// Pure function: given the script (normalized units), the words just heard and
// the current position, return the new position.
export function followSpeech(norm, spokenWords, from) {
  let p = from;
  const misses = [];
  for (const raw of spokenWords) {
    const w = normalizeWord(raw);
    if (!w) continue;

    let matched = false;
    let seen = 0;
    for (let j = p; j < norm.length && seen < LOOKAHEAD; j++) {
      const s = norm[j];
      if (!s) continue;
      if (similar(s, w)) {
        // A short word like "the" shouldn't make us jump far ahead.
        if (seen > 2 && w.length < 4) break;
        p = j + 1;
        matched = true;
        break;
      }
      seen++;
    }

    if (matched) {
      misses.length = 0;
      continue;
    }

    // Lost? Try to re-find the last three heard words elsewhere in the script.
    misses.push(w);
    if (misses.length >= 3) {
      const seq = misses.slice(-3);
      let r = findSequence(norm, seq, p, p + RESYNC_AHEAD);
      if (r < 0) r = findSequence(norm, seq, p - RESYNC_BEHIND, p);
      if (r >= 0) {
        p = r;
        misses.length = 0;
      }
    }
  }
  return p;
}

const splitWords = (text) => text.split(/\s+/).filter(Boolean);

export class Teleprompter {
  constructor({ scrollEl, textEl, onStatus, onHeard }) {
    this.scrollEl = scrollEl;
    this.textEl = textEl;
    this.onStatus = onStatus || (() => {});
    this.onHeard = onHeard || (() => {});

    this.spans = [];      // one per visible word
    this.units = [];      // matchable pieces: { n: normalized text, s: span index }
    this.spanFirst = [];  // first unit index of each span
    this.norm = [];

    this.pos = 0;         // committed position (unit index of the next word to say)
    this.tentative = 0;   // position including not-yet-final speech
    this.curSpan = -1;
    this.lastScrollTop = null;

    this.listening = false;
    this.rec = null;
    this.lang = 'en-IN';
    this.errorStreak = 0;

    textEl.addEventListener('click', (e) => {
      const span = e.target.closest('[data-i]');
      if (span) this.jumpToSpan(Number(span.dataset.i));
    });
  }

  static get supported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  get finished() {
    return this.units.length > 0 && Math.max(this.pos, this.tentative) >= this.units.length;
  }

  setScript(text) {
    this.textEl.textContent = '';
    this.spans = [];
    this.units = [];
    this.spanFirst = [];

    const paragraphs = text.replace(/\r/g, '').split(/\n\s*\n/);
    for (const para of paragraphs) {
      const p = document.createElement('p');
      para.split('\n').forEach((line, li) => {
        if (li > 0 && p.childNodes.length) p.appendChild(document.createElement('br'));
        for (const token of splitWords(line)) {
          const spanIndex = this.spans.length;
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = token;
          span.dataset.i = spanIndex;
          p.append(span, ' ');
          this.spans.push(span);
          this.spanFirst.push(this.units.length);

          // "well-known" or "2025–26" become separate matchable pieces
          const parts = token.split(/[-–—/]+/).map(normalizeWord).filter(Boolean);
          if (parts.length === 0) this.units.push({ n: '', s: spanIndex });
          for (const n of parts) this.units.push({ n, s: spanIndex });
        }
      });
      if (p.childNodes.length) this.textEl.appendChild(p);
    }

    this.norm = this.units.map((u) => u.n);
    this.pos = 0;
    this.tentative = 0;
    this.curSpan = -1;
    this.lastScrollTop = null;
    this.render(true);
  }

  // ---- position control ----

  setPosition(unitIndex) {
    this.pos = Math.max(0, Math.min(unitIndex, this.units.length));
    this.tentative = this.pos;
    this.render();
  }

  jumpToSpan(spanIndex) {
    if (spanIndex >= this.spans.length) return this.setPosition(this.units.length);
    this.setPosition(this.spanFirst[Math.max(0, spanIndex)]);
  }

  nudge(delta) {
    const current = this.curSpan < 0 ? 0 : this.curSpan;
    this.jumpToSpan(Math.max(0, Math.min(this.spans.length, current + delta)));
  }

  reset() {
    this.setPosition(0);
    this.scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- drawing ----

  render(force = false) {
    const eff = Math.min(Math.max(this.pos, this.tentative), this.units.length);
    let cur = eff;
    while (cur < this.units.length && !this.units[cur].n) cur++;
    const curSpan = cur < this.units.length ? this.units[cur].s : this.spans.length;

    if (force) {
      for (let i = 0; i < this.spans.length; i++) this.paint(i, curSpan);
    } else if (curSpan !== this.curSpan) {
      const prev = this.curSpan < 0 ? 0 : this.curSpan;
      const lo = Math.max(0, Math.min(prev, curSpan) - 1);
      const hi = Math.min(this.spans.length - 1, Math.max(prev, curSpan) + 1);
      for (let i = lo; i <= hi; i++) this.paint(i, curSpan);
    }
    this.curSpan = curSpan;
    this.scrollToCurrent();
  }

  paint(i, curSpan) {
    const el = this.spans[i];
    el.classList.toggle('spoken', i < curSpan);
    el.classList.toggle('current', i === curSpan);
  }

  scrollToCurrent() {
    const el = this.spans[Math.min(this.curSpan, this.spans.length - 1)];
    if (!el) return;
    // The text has top padding of 30% of the prompter height, so offsetTop minus
    // that padding puts the current line on the reading mark.
    const padding = parseFloat(getComputedStyle(this.textEl).paddingTop) || 0;
    const top = Math.max(0, el.offsetTop - padding);
    if (top !== this.lastScrollTop) {
      this.lastScrollTop = top;
      this.scrollEl.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Call after font size / layout changes.
  relayout() {
    this.lastScrollTop = null;
    this.scrollToCurrent();
  }

  // ---- speech recognition ----

  startListening(lang) {
    if (!Teleprompter.supported) {
      this.onStatus('error', 'Speech recognition needs Google Chrome or Microsoft Edge');
      return false;
    }
    if (lang) this.lang = lang;
    if (this.listening) return true;
    this.listening = true;
    this.errorStreak = 0;
    this.spawn();
    return true;
  }

  stopListening() {
    this.listening = false;
    this.pos = Math.max(this.pos, this.tentative);
    this.tentative = this.pos;
    if (this.rec) {
      try { this.rec.stop(); } catch { /* already stopped */ }
    }
    this.onStatus('idle', 'Prompter paused');
    this.onHeard('');
  }

  setLanguage(lang) {
    this.lang = lang;
    if (this.listening && this.rec) {
      try { this.rec.stop(); } catch { /* restarts in onend with the new language */ }
    }
  }

  spawn() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    this.rec = rec;

    let doneFinal = 0; // results in this session already applied to `pos`

    rec.onstart = () => this.onStatus('listening', 'Listening — start reading');

    rec.onresult = (e) => {
      this.errorStreak = 0;
      for (let i = doneFinal; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r.isFinal) break;
        this.pos = followSpeech(this.norm, splitWords(r[0].transcript), this.pos);
        doneFinal = i + 1;
      }
      const interim = [];
      for (let i = doneFinal; i < e.results.length; i++) {
        if (!e.results[i].isFinal) interim.push(...splitWords(e.results[i][0].transcript));
      }
      this.tentative = interim.length ? followSpeech(this.norm, interim, this.pos) : this.pos;
      this.render();

      const last = e.results[e.results.length - 1];
      if (last) this.onHeard(last[0].transcript.trim());
      if (this.finished) this.onStatus('listening', 'End of script ✓');
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.listening = false;
        this.onStatus('error', 'Microphone permission was blocked for speech recognition');
        return;
      }
      this.errorStreak++;
      const msg = e.error === 'network'
        ? 'Speech service unreachable — check your internet connection'
        : `Speech error: ${e.error}`;
      this.onStatus('error', msg);
      if (this.errorStreak > 5) {
        this.listening = false;
        this.onStatus('error', `${msg}. Prompter stopped.`);
      }
    };

    rec.onend = () => {
      // Chrome ends recognition after pauses; restart quietly while listening.
      this.pos = Math.max(this.pos, this.tentative);
      this.tentative = this.pos;
      if (this.listening) {
        setTimeout(() => { if (this.listening) this.spawn(); }, 150);
      }
    };

    try {
      rec.start();
    } catch (err) {
      this.onStatus('error', `Could not start speech recognition: ${err.message}`);
      this.listening = false;
    }
  }
}
