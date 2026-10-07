const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

const now = new Date();
const todayIdx = now.getDay();

document.getElementById("date").textContent =
  now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const weekEl = document.getElementById("week");
const buttons = {};

WEEK_ORDER.forEach(i => {
  const b = document.createElement("button");
  b.className = "day" + (i === todayIdx ? " today" : "");
  b.textContent = SESSIONS[i].day.slice(0, 3);
  b.setAttribute("aria-label", SESSIONS[i].day + ": " + SESSIONS[i].title);
  b.addEventListener("click", () => show(i));
  weekEl.appendChild(b);
  buttons[i] = b;
});


// Turn file names into readable titles: drop extension, dates, weekday names and stray separators
const MONTHS = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE_PATTERNS = [
  new RegExp("\\b\\d{1,2}(?:st|nd|rd|th)?[\\s\\-_]*" + MONTHS + "(?:[\\s,\\-_]*\\d{4}|[\\s,\\-_]+\\d{2})?\\b", "gi"), // 1st Feb 2025
  new RegExp("\\b" + MONTHS + "[\\s\\-_]*\\d{1,2}(?:st|nd|rd|th)?(?:[\\s,\\-_]*\\d{4})?\\b", "gi"),                  // Feb 1, 2025
  /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}\b/g,   // 01-02-2025
  /\b\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}\b/g,   // 2025-02-01
  /\b\d{1,2}[\/.]\d{1,2}[\/.]\d{2}\b/g,       // 01/02/25
  /\b(?:mon|tues|wednes|thurs|fri|satur|sun)day\b/gi
];
function clean(n) {
  let t = n.replace(/\.(mp4|mov|mkv|webm|pdf|mp3|m4a|wav|aac|ogg)$/i, "").replace(/_/g, " ");
  DATE_PATTERNS.forEach(re => { t = t.replace(re, " "); });
  t = t.replace(/(?<!\d)-|-(?!\d)/g, " ")          // hyphens become spaces, but keep 4-7-8
       .replace(/\s*[｜|·]\s*/g, " · ")
       .replace(/(\s·\s*)+/g, " · ")
       .replace(/\s+/g, " ")
       .replace(/^[\s·,]+|[\s·,]+$/g, "");
  return t || n;
}

const breathingButtons = [];
const videoEl = document.getElementById("video");
const panel = document.getElementById("audioPanel");
const audio = document.getElementById("audio");
const roundEl = document.getElementById("round");
const totalEl = document.getElementById("total");
const repButtons = [...document.querySelectorAll(".rep")];
let target = 1, played = 0;

function setHeading(heading, subtitle) {
  document.getElementById("dayName").textContent = heading;
  document.getElementById("session").textContent = subtitle;
}

function stopAudio() {
  audio.pause();
  if (typeof audioNote !== "undefined") audioNote.hidden = true;
  panel.hidden = true;
  videoEl.hidden = false;
}

function load(id, heading, subtitle) {
  stopAudio();
  setHeading(heading, subtitle);
  videoEl.src = "https://drive.google.com/file/d/" + id + "/preview";
  document.getElementById("driveLink").href = "https://drive.google.com/file/d/" + id + "/view";
}

function fmt(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? m + " min" + (s ? " " + s + " s" : "") : s + " s";
}
function updateRound() {
  roundEl.textContent = target === 1 ? (played ? "Done" : "Ready")
    : (played >= target ? "Done · " + target + " rounds" : "Round " + Math.min(played + 1, target) + " of " + target);
  totalEl.textContent = isFinite(audio.duration) && audio.duration > 0
    ? "Total about " + fmt(audio.duration * target) : "";
}
function setTarget(n) {
  target = n; played = 0;
  repButtons.forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.n) === n)));
  updateRound();
}
repButtons.forEach(b => b.addEventListener("click", () => {
  setTarget(Number(b.dataset.n));
  audio.currentTime = 0;
  audio.play().catch(() => {});
}));

audio.addEventListener("loadedmetadata", () => {
  // Short tracks like the 19-second 4-7-8 timer default to 15 repeats
  if (audio.dataset.fresh === "1") { setTarget(audio.duration < 120 ? 15 : 1); audio.dataset.fresh = "0"; }
  updateRound();
});
audio.addEventListener("ended", () => {
  played++;
  if (played < target) { audio.currentTime = 0; audio.play().catch(() => {}); }
  updateRound();
});
// Try several sources in turn: a copy kept next to the page first (most reliable),
// then Google Drive's direct links. If none work, fall back to Drive's own player.
const audioNote = document.createElement("p");
audioNote.className = "fallback";
audioNote.hidden = true;
document.querySelector(".center .fallback").after(audioNote);

let sources = [], srcIdx = 0, currentItem = null;

function tryNextSource() {
  if (srcIdx < sources.length) {
    audio.src = sources[srcIdx++];
    audio.load();
    return;
  }
  // Every source failed → use Drive's preview player (plays once, repeats not possible there)
  panel.hidden = true;
  videoEl.hidden = false;
  videoEl.src = "https://drive.google.com/file/d/" + currentItem.id + "/preview";
  audioNote.hidden = false;
  audioNote.textContent = "Repeat counting isn't available for this track from Google Drive. " +
    "Upload it to the yoga/audio folder of your GitHub repo to enable 15 / 30 repeats.";
}

audio.addEventListener("error", () => {
  if (!panel.hidden) tryNextSource();
});

function loadAudio(item, heading, subtitle) {
  currentItem = item;
  audioNote.hidden = true;
  videoEl.src = "about:blank";
  videoEl.hidden = true;
  panel.hidden = false;
  setHeading(heading, subtitle);
  document.getElementById("driveLink").href = "https://drive.google.com/file/d/" + item.id + "/view";
  sources = [
    item.src,
    "audio/" + encodeURIComponent(item.name),
    "https://drive.usercontent.google.com/download?id=" + item.id + "&export=download",
    "https://drive.google.com/uc?export=download&id=" + item.id
  ].filter(Boolean);
  srcIdx = 0;
  audio.dataset.fresh = "1";
  setTarget(1);
  roundEl.textContent = "Loading…";
  tryNextSource();
}

function show(i) {
  const s = SESSIONS[i];
  load(s.id, i === todayIdx ? "Today, " + s.day : s.day, s.title);
  Object.entries(buttons).forEach(([k, b]) => b.setAttribute("aria-pressed", String(Number(k) === i)));
  breathingButtons.forEach(b => b.removeAttribute("aria-current"));
}

const isAudioItem = v => v.kind === "audio" || /\.(mp3|m4a|wav|aac|ogg)$/i.test(v.name);

function showBreathing(idx) {
  const item = BREATHING[idx];
  if (isAudioItem(item)) loadAudio(item, "Breathing & Pranayam", clean(item.name));
  else load(item.id, "Breathing & Pranayam", clean(item.name));
  Object.values(buttons).forEach(b => b.setAttribute("aria-pressed", "false"));
  breathingButtons.forEach((b, k) => b.setAttribute("aria-current", String(k === idx)));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector(".player").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
}

if (BREATHING.length) {
  const ul = document.getElementById("breathingList");
  BREATHING.forEach((v, idx) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    const isAudio = isAudioItem(v);
    b.className = "item";
    b.innerHTML = '<span class="icon">' + (isAudio ? "♪" : idx + 1) + '</span><span class="name"></span><span class="action">' + (isAudio ? "Listen" : "Play") + '</span>';
    b.querySelector(".name").textContent = clean(v.name);
    b.addEventListener("click", () => showBreathing(idx));
    li.appendChild(b); ul.appendChild(li);
    breathingButtons.push(b);
  });
  document.getElementById("breathingSection").hidden = false;
}

if (PDFS.length) {
  const ul = document.getElementById("pdfList");
  PDFS.forEach(p => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "item";
    a.href = "https://drive.google.com/file/d/" + p.id + "/view";
    a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = '<span class="icon">PDF</span><span class="name"></span><span class="action">Open</span>';
    a.querySelector(".name").textContent = clean(p.name);
    li.appendChild(a); ul.appendChild(li);
  });
  document.getElementById("pdfSection").hidden = false;
}

show(todayIdx);
