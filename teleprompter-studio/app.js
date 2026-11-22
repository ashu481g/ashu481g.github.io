import { Teleprompter } from './teleprompter.js';
import { Compositor, makePresetBackgrounds } from './background.js';

const $ = (id) => document.getElementById(id);

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`tps.${key}`);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(`tps.${key}`, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

const DEFAULT_SCRIPT = `Hello, and welcome to my channel.

This is a sample script for the teleprompter. Click "Edit script" to replace it with your own words.

When you start speaking, the words you have already said fade out, and the next word to say is highlighted in yellow. The text scrolls on its own so your current line always stays near the top of the screen, close to the camera.

If the prompter ever loses your place, just click the word you are on, or use the arrow keys.

Thank you for watching!`;

// ---------- elements ----------
const video = $('video');
const canvas = $('preview');
const els = {
  placeholder: $('placeholder'),
  camBtn: $('camBtn'),
  recBtn: $('recBtn'),
  listenBtn: $('listenBtn'),
  resetBtn: $('resetBtn'),
  editBtn: $('editBtn'),
  recBadge: $('recBadge'),
  recTime: $('recTime'),
  countdown: $('countdown'),
  modelBadge: $('modelBadge'),
  statusDot: $('statusDot'),
  status: $('prompterStatus'),
  heard: $('heardText'),
  bgGrid: $('bgGrid'),
  bgFile: $('bgFile'),
  blurAmt: $('blurAmt'),
  blurRow: $('blurRow'),
  bgColor: $('bgColor'),
  colorRow: $('colorRow'),
  colorSwatch: $('colorSwatch'),
  uploadSwatch: $('uploadSwatch'),
  fontSize: $('fontSize'),
  prompterHeight: $('prompterHeight'),
  lang: $('lang'),
  listenWithRec: $('listenWithRec'),
  restartOnTake: $('restartOnTake'),
  camSelect: $('camSelect'),
  micSelect: $('micSelect'),
  resolution: $('resolution'),
  mirror: $('mirror'),
  countdownOn: $('countdownOn'),
  autoDownload: $('autoDownload'),
  takes: $('takes'),
  takeCount: $('takeCount'),
  dialog: $('scriptDialog'),
  scriptInput: $('scriptInput'),
  wordCount: $('wordCount'),
  toast: $('toast'),
};

// ---------- state ----------
let stream = null;
let rafId = 0;
let recorder = null;
let recStartedAt = 0;
let timerId = 0;
let countingDown = false;
let cancelCountdown = null;
let takeNo = 0;
let uploadedImage = null;

// ---------- helpers ----------
let toastTimer = 0;
function toast(msg, ms = 3500) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), ms);
}

const fmtTime = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const fmtSize = (bytes) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`);

const isTyping = (e) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;

// ---------- teleprompter ----------
const prompter = new Teleprompter({
  scrollEl: $('prompterScroll'),
  textEl: $('prompterText'),
  onStatus: (state, text) => {
    els.statusDot.className = `status-dot ${state}`;
    els.status.textContent = text;
    if (state === 'error' && !prompter.listening) updateListenBtn();
  },
  onHeard: (text) => { els.heard.textContent = text ? `“${text}”` : ''; },
});

prompter.setScript(store.get('script', DEFAULT_SCRIPT));

function updateListenBtn() {
  const on = prompter.listening;
  els.listenBtn.textContent = on ? '⏸ Pause prompter' : '🎙 Start prompter';
  els.listenBtn.classList.toggle('active', on);
}

function startListening() {
  if (prompter.startListening(els.lang.value)) updateListenBtn();
  else toast('Voice tracking needs Google Chrome or Microsoft Edge. You can still click words or use the arrow keys.', 6000);
}

function stopListening() {
  prompter.stopListening();
  updateListenBtn();
}

els.listenBtn.addEventListener('click', () => (prompter.listening ? stopListening() : startListening()));
els.resetBtn.addEventListener('click', () => prompter.reset());

// Script editor
function updateWordCount() {
  const words = els.scriptInput.value.split(/\s+/).filter(Boolean).length;
  const mins = words / 140; // average speaking pace
  els.wordCount.textContent = `${words} words · about ${mins < 1 ? '<1' : Math.round(mins)} min to read`;
}
els.editBtn.addEventListener('click', () => {
  els.scriptInput.value = store.get('script', DEFAULT_SCRIPT);
  updateWordCount();
  els.dialog.showModal();
  els.scriptInput.focus();
});
els.scriptInput.addEventListener('input', updateWordCount);
els.dialog.addEventListener('close', () => {
  if (els.dialog.returnValue !== 'save') return;
  const text = els.scriptInput.value.trim() || DEFAULT_SCRIPT;
  store.set('script', text);
  prompter.setScript(text);
});

// Prompter appearance
function applyPrompterLook() {
  document.documentElement.style.setProperty('--prompter-size', `${els.fontSize.value}px`);
  document.documentElement.style.setProperty('--prompter-h', `${els.prompterHeight.value}vh`);
  store.set('fontSize', els.fontSize.value);
  store.set('prompterHeight', els.prompterHeight.value);
  requestAnimationFrame(() => prompter.relayout());
}
els.fontSize.value = store.get('fontSize', 40);
els.prompterHeight.value = store.get('prompterHeight', 30);
els.fontSize.addEventListener('input', applyPrompterLook);
els.prompterHeight.addEventListener('input', applyPrompterLook);
window.addEventListener('resize', () => prompter.relayout());
applyPrompterLook();

els.lang.value = store.get('lang', 'en-IN');
els.lang.addEventListener('change', () => {
  store.set('lang', els.lang.value);
  prompter.setLanguage(els.lang.value);
});

// ---------- background ----------
const compositor = new Compositor(video, canvas, {
  onModelState: (state) => {
    if (state === 'loading') {
      els.modelBadge.textContent = 'Loading background model…';
      els.modelBadge.classList.remove('hidden');
    } else if (state === 'ready') {
      els.modelBadge.classList.add('hidden');
    } else if (state === 'error') {
      els.modelBadge.classList.add('hidden');
      selectBgButton('none');
      toast('Could not load the background model. It is downloaded the first time, so check your internet connection.', 7000);
    }
  },
});

const presets = makePresetBackgrounds();
const uploadBtn = els.bgGrid.querySelector('[data-bg="upload"]');
presets.forEach((preset, i) => {
  const btn = document.createElement('button');
  btn.className = 'bg-opt';
  btn.dataset.bg = `preset:${i}`;
  const sw = document.createElement('span');
  sw.className = 'sw';
  sw.style.backgroundImage = `url(${preset.canvas.toDataURL('image/jpeg', 0.7)})`;
  btn.append(sw, preset.name);
  els.bgGrid.insertBefore(btn, uploadBtn);
});

function selectBgButton(key) {
  els.bgGrid.querySelectorAll('.bg-opt').forEach((b) => b.classList.toggle('active', b.dataset.bg === key));
  els.blurRow.classList.toggle('hidden', key !== 'blur');
  els.colorRow.classList.toggle('hidden', key !== 'color');
}

function applyBackground(key) {
  selectBgButton(key);
  store.set('bg', key);
  if (key === 'none') return compositor.setMode('none');
  if (key === 'blur') return compositor.setMode('blur');
  if (key === 'color') return compositor.setMode('color');
  if (key.startsWith('preset:')) {
    compositor.image = presets[Number(key.split(':')[1])].canvas;
    return compositor.setMode('image');
  }
  if (key === 'upload' && uploadedImage) {
    compositor.image = uploadedImage;
    return compositor.setMode('image');
  }
  return null;
}

els.bgGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.bg-opt');
  if (!btn) return;
  if (btn.dataset.bg === 'upload' && !uploadedImage) {
    els.bgFile.click();
    return;
  }
  applyBackground(btn.dataset.bg);
});

uploadBtn.addEventListener('dblclick', () => els.bgFile.click());
els.bgFile.addEventListener('change', () => {
  const file = els.bgFile.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    uploadedImage = img;
    els.uploadSwatch.textContent = '';
    els.uploadSwatch.style.backgroundImage = `url(${img.src})`;
    applyBackground('upload');
    toast('Background set. Double-click "Your image" to choose a different picture.');
  };
  img.src = URL.createObjectURL(file);
  els.bgFile.value = '';
});

els.blurAmt.value = store.get('blur', 14);
compositor.blur = Number(els.blurAmt.value);
els.blurAmt.addEventListener('input', () => {
  compositor.blur = Number(els.blurAmt.value);
  store.set('blur', els.blurAmt.value);
});

els.bgColor.value = store.get('color', '#1d3557');
compositor.color = els.bgColor.value;
els.colorSwatch.style.background = els.bgColor.value;
els.bgColor.addEventListener('input', () => {
  compositor.color = els.bgColor.value;
  els.colorSwatch.style.background = els.bgColor.value;
  store.set('color', els.bgColor.value);
});

const savedBg = store.get('bg', 'none');
applyBackground(savedBg === 'upload' ? 'none' : savedBg);

// ---------- camera ----------
els.mirror.checked = store.get('mirror', true);
canvas.classList.toggle('mirrored', els.mirror.checked);
els.mirror.addEventListener('change', () => {
  canvas.classList.toggle('mirrored', els.mirror.checked);
  store.set('mirror', els.mirror.checked);
});

els.resolution.value = store.get('resolution', '1280x720');
els.countdownOn.checked = store.get('countdown', true);
els.autoDownload.checked = store.get('autoDownload', false);
els.listenWithRec.checked = store.get('listenWithRec', true);
els.restartOnTake.checked = store.get('restartOnTake', true);
for (const id of ['countdownOn', 'autoDownload', 'listenWithRec', 'restartOnTake']) {
  els[id].addEventListener('change', () => store.set(id === 'countdownOn' ? 'countdown' : id, els[id].checked));
}

async function populateDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const fill = (select, kind, saved) => {
    const list = devices.filter((d) => d.kind === kind);
    select.textContent = '';
    list.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `${kind === 'videoinput' ? 'Camera' : 'Microphone'} ${i + 1}`;
      select.appendChild(opt);
    });
    if (saved && list.some((d) => d.deviceId === saved)) select.value = saved;
  };
  const activeCam = stream?.getVideoTracks()[0]?.getSettings().deviceId;
  const activeMic = stream?.getAudioTracks()[0]?.getSettings().deviceId;
  fill(els.camSelect, 'videoinput', activeCam || store.get('cam', ''));
  fill(els.micSelect, 'audioinput', activeMic || store.get('mic', ''));
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    toast('Camera access needs the page to be opened from http://localhost — use the start script.', 7000);
    return;
  }
  stopCamera();
  const [w, h] = els.resolution.value.split('x').map(Number);
  const camId = store.get('cam', '');
  const micId = store.get('mic', '');
  const constraints = {
    video: {
      width: { ideal: w },
      height: { ideal: h },
      frameRate: { ideal: 30 },
      ...(camId ? { deviceId: { ideal: camId } } : {}),
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...(micId ? { deviceId: { ideal: micId } } : {}),
    },
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.error(err);
    const why = err.name === 'NotAllowedError'
      ? 'Camera/microphone permission was denied. Allow it from the icon in the address bar.'
      : err.name === 'NotFoundError'
        ? 'No camera or microphone was found.'
        : `Could not start the camera: ${err.message}`;
    toast(why, 7000);
    return;
  }

  video.srcObject = stream;
  await video.play();
  compositor.resize(video.videoWidth || w, video.videoHeight || h);

  els.placeholder.classList.add('hidden');
  els.camBtn.textContent = 'Stop camera';
  els.recBtn.disabled = false;

  const loop = () => {
    compositor.render();
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  populateDevices().catch(() => {});
}

function stopCamera() {
  if (recorder && recorder.state !== 'inactive') stopRecording();
  cancelAnimationFrame(rafId);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  els.placeholder.classList.remove('hidden');
  els.camBtn.textContent = 'Start camera';
  els.recBtn.disabled = true;
}

els.camBtn.addEventListener('click', () => (stream ? stopCamera() : startCamera()));
$('placeholderStart').addEventListener('click', startCamera);

els.camSelect.addEventListener('change', () => { store.set('cam', els.camSelect.value); if (stream) startCamera(); });
els.micSelect.addEventListener('change', () => { store.set('mic', els.micSelect.value); if (stream) startCamera(); });
els.resolution.addEventListener('change', () => { store.set('resolution', els.resolution.value); if (stream) startCamera(); });

// ---------- recording ----------
function pickMimeType() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
}

function runCountdown(seconds) {
  return new Promise((resolve) => {
    countingDown = true;
    let n = seconds;
    els.countdown.textContent = n;
    els.countdown.classList.remove('hidden');
    const tick = setInterval(() => {
      n--;
      if (n > 0) {
        els.countdown.textContent = n;
        return;
      }
      finish(true);
    }, 1000);
    function finish(ok) {
      clearInterval(tick);
      countingDown = false;
      cancelCountdown = null;
      els.countdown.classList.add('hidden');
      resolve(ok);
    }
    cancelCountdown = () => finish(false);
  });
}

async function startRecording() {
  if (!stream || (recorder && recorder.state !== 'inactive')) return;
  if (!window.MediaRecorder) {
    toast('This browser cannot record video. Please use Chrome or Edge.');
    return;
  }

  if (els.restartOnTake.checked) prompter.reset();
  els.recBtn.classList.add('recording');
  els.recBtn.querySelector('.label').textContent = 'Cancel';

  if (els.countdownOn.checked) {
    const ok = await runCountdown(3);
    if (!ok) {
      els.recBtn.classList.remove('recording');
      els.recBtn.querySelector('.label').textContent = 'Record';
      return;
    }
  }
  if (!stream) return;

  const canvasStream = canvas.captureStream(30);
  const mixed = new MediaStream([...canvasStream.getVideoTracks(), ...stream.getAudioTracks()]);
  const mimeType = pickMimeType();
  const chunks = [];

  try {
    recorder = new MediaRecorder(mixed, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 6_000_000,
      audioBitsPerSecond: 128_000,
    });
  } catch (err) {
    toast(`Could not start recording: ${err.message}`);
    els.recBtn.classList.remove('recording');
    els.recBtn.querySelector('.label').textContent = 'Record';
    return;
  }

  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = () => {
    canvasStream.getTracks().forEach((t) => t.stop());
    const type = recorder.mimeType || mimeType || 'video/webm';
    addTake(new Blob(chunks, { type }), Date.now() - recStartedAt);
  };

  recorder.start(1000);
  recStartedAt = Date.now();
  els.recBtn.querySelector('.label').textContent = 'Stop';
  els.recBadge.classList.remove('hidden');
  els.recTime.textContent = '00:00';
  timerId = setInterval(() => { els.recTime.textContent = fmtTime(Date.now() - recStartedAt); }, 250);

  if (els.listenWithRec.checked && !prompter.listening) startListening();
}

function stopRecording() {
  if (!recorder || recorder.state === 'inactive') return;
  recorder.stop();
  clearInterval(timerId);
  els.recBadge.classList.add('hidden');
  els.recBtn.classList.remove('recording');
  els.recBtn.querySelector('.label').textContent = 'Record';
  if (els.listenWithRec.checked && prompter.listening) stopListening();
}

function toggleRecording() {
  if (countingDown && cancelCountdown) return cancelCountdown();
  if (recorder && recorder.state !== 'inactive') return stopRecording();
  return startRecording();
}

els.recBtn.addEventListener('click', toggleRecording);

function addTake(blob, durationMs) {
  takeNo++;
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
  const filename = `take-${String(takeNo).padStart(2, '0')}_${stamp}.${ext}`;
  const url = URL.createObjectURL(blob);

  const empty = els.takes.querySelector('.empty');
  if (empty) empty.remove();

  const li = document.createElement('li');
  const meta = document.createElement('div');
  meta.className = 'meta';
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = `Take ${takeNo}`;
  const sub = document.createElement('div');
  sub.className = 'sub';
  sub.textContent = `${fmtTime(durationMs)} · ${fmtSize(blob.size)} · ${ext.toUpperCase()}`;
  meta.append(name, sub);

  const play = document.createElement('a');
  play.className = 'btn small';
  play.href = url;
  play.target = '_blank';
  play.rel = 'noopener';
  play.textContent = '▶';
  play.title = 'Play in a new tab';

  const dl = document.createElement('a');
  dl.className = 'btn small';
  dl.href = url;
  dl.download = filename;
  dl.textContent = 'Download';

  li.append(meta, play, dl);
  els.takes.prepend(li);
  els.takeCount.textContent = `(${takeNo})`;

  if (els.autoDownload.checked) dl.click();
  else toast(`Take ${takeNo} saved — click Download to keep it.`);
}

window.addEventListener('beforeunload', (e) => {
  if (takeNo > 0 || (recorder && recorder.state === 'recording')) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ---------- keyboard ----------
document.addEventListener('keydown', (e) => {
  if (isTyping(e) || els.dialog.open || e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.key) {
    case 'r':
    case 'R':
      if (stream) toggleRecording();
      break;
    case 'l':
    case 'L':
      prompter.listening ? stopListening() : startListening();
      break;
    case 'ArrowRight':
      prompter.nudge(1);
      e.preventDefault();
      break;
    case 'ArrowLeft':
      prompter.nudge(-1);
      e.preventDefault();
      break;
    case 'Home':
      prompter.reset();
      e.preventDefault();
      break;
    default:
  }
});

if (!Teleprompter.supported) {
  els.status.textContent = 'Voice tracking needs Chrome or Edge — click words or use arrow keys';
}
