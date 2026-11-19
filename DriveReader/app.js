// ================== SETTINGS ==================
// Paste your OAuth Client ID from Google Cloud Console (see README.md).
const CLIENT_ID = 'PASTE_YOUR_CLIENT_ID.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
// ==============================================

const DRIVE = 'https://www.googleapis.com/drive/v3/';
const MIME = {
  pdf: 'application/pdf',
  folder: 'application/vnd.google-apps.folder',
  shortcut: 'application/vnd.google-apps.shortcut',
};
const FIELDS = 'nextPageToken, files(id,name,mimeType,size,modifiedTime,shortcutDetails)';
const ROOTS = {
  drive: { kind: 'folder', id: 'root', name: 'My Drive' },
  shared: { kind: 'shared', name: 'Shared with me' },
  recent: { kind: 'recent', name: 'Recent PDFs' },
};

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- storage helpers (never throw) ----------
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
const session = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* ignore */ } },
};

// ================== AUTH ==================
let tokenClient = null;
let token = null;
let tokenExp = 0;
let pendingAuth = null;

function waitForGis() {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - t0 > 15000) return reject(new Error('Could not load Google sign-in. Check your internet connection.'));
      setTimeout(poll, 100);
    })();
  });
}

function initTokenClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (resp) => {
      const p = pendingAuth; pendingAuth = null;
      if (resp.error) { p?.reject(new Error(resp.error_description || resp.error)); return; }
      token = resp.access_token;
      tokenExp = Date.now() + (Number(resp.expires_in || 3600) - 60) * 1000;
      session.set('tok', { token, tokenExp });
      store.set('signedInBefore', true);
      p?.resolve(token);
    },
    error_callback: (err) => {
      const p = pendingAuth; pendingAuth = null;
      const msg = err?.type === 'popup_closed' ? 'Sign-in window was closed.'
        : err?.type === 'popup_failed_to_open' ? 'Pop-up was blocked. Tap again.'
        : (err?.message || err?.type || 'Sign-in failed.');
      p?.reject(new Error(msg));
    },
  });
}

function requestToken(prompt = '') {
  if (pendingAuth) return pendingAuth.promise;
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  pendingAuth = { resolve, reject, promise };
  tokenClient.requestAccessToken({ prompt });
  return promise;
}

const haveToken = () => token && Date.now() < tokenExp;

async function ensureToken() {
  if (haveToken()) return token;
  try { return await requestToken(''); } catch (e) { showReconnect(); throw e; }
}

function showReconnect() { $('#reconnect').hidden = false; }

// ================== DRIVE API ==================
async function api(path, params = {}, { signal, raw = false } = {}) {
  await ensureToken();
  const url = new URL(DRIVE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal });
  if (res.status === 401) {
    token = null; session.del('tok'); showReconnect();
    throw new Error('Google session expired. Tap Reconnect.');
  }
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message || ''; } catch { /* ignore */ }
    throw new Error(`Google Drive error ${res.status}${detail ? ': ' + detail : ''}`);
  }
  return raw ? res : res.json();
}

const qesc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function buildQuery(loc) {
  const types = `(mimeType='${MIME.folder}' or mimeType='${MIME.pdf}' or mimeType='${MIME.shortcut}')`;
  switch (loc.kind) {
    case 'folder': return { q: `'${qesc(loc.id)}' in parents and trashed=false and ${types}`, orderBy: 'folder,name_natural' };
    case 'shared': return { q: `sharedWithMe and trashed=false and ${types}`, orderBy: 'folder,name_natural' };
    case 'recent': return { q: `mimeType='${MIME.pdf}' and trashed=false`, orderBy: 'viewedByMeTime desc', pageSize: 50, noMore: true };
    case 'search': return {
      q: `name contains '${qesc(loc.text)}' and trashed=false and (mimeType='${MIME.folder}' or mimeType='${MIME.pdf}')`,
      orderBy: 'folder,name_natural',
    };
    default: return buildQuery(ROOTS.drive);
  }
}

// Turn shortcuts into their targets; drop anything that isn't a folder or PDF.
function normalize(files) {
  const out = [];
  for (const f of files) {
    if (f.mimeType === MIME.shortcut) {
      const t = f.shortcutDetails;
      if (t && (t.targetMimeType === MIME.folder || t.targetMimeType === MIME.pdf)) {
        out.push({ id: t.targetId, name: f.name, mimeType: t.targetMimeType, modifiedTime: f.modifiedTime });
      }
    } else if (f.mimeType === MIME.folder || f.mimeType === MIME.pdf) {
      out.push(f);
    }
  }
  return out.sort((a, b) => (b.mimeType === MIME.folder) - (a.mimeType === MIME.folder));
}

// ================== BROWSER ==================
let stack = loadStack();
let listToken = null;
let listAbort = null;

function loadStack() {
  const s = store.get('stack');
  return Array.isArray(s) && s.length && s[0]?.kind ? s : [ROOTS.drive];
}
const saveStack = () => store.set('stack', stack);

function show(view) {
  for (const id of ['signin', 'browser', 'viewer']) $('#' + id).hidden = id !== view;
}

function enterBrowser() {
  show('browser');
  renderResume();
  loadList();
}

function setStatus(msg, isError = false) {
  const el = $('#status');
  el.textContent = msg;
  el.classList.toggle('error', isError);
}

function renderCrumbs() {
  const nav = $('#crumbs');
  nav.replaceChildren();
  stack.forEach((loc, i) => {
    if (i) { const s = document.createElement('span'); s.className = 'sep'; s.textContent = '›'; nav.append(s); }
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = loc.name;
    b.onclick = () => { if (i < stack.length - 1) { stack = stack.slice(0, i + 1); saveStack(); loadList(); } };
    nav.append(b);
  });
}

function setActiveTab() {
  const root = stack[0];
  const tab = root.kind === 'shared' ? 'shared' : root.kind === 'recent' ? 'recent' : root.kind === 'folder' ? 'drive' : '';
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
}

async function loadList(append = false) {
  const loc = stack[stack.length - 1];
  renderCrumbs();
  setActiveTab();
  $('#resume').hidden = !(stack.length === 1 && stack[0].kind === 'folder' && store.get('lastFile'));
  if (!append) { $('#list').replaceChildren(); listToken = null; $('#more').hidden = true; }

  listAbort?.abort();
  listAbort = new AbortController();
  setStatus('Loading…');

  const { q, orderBy, pageSize = 200, noMore } = buildQuery(loc);
  const params = {
    q, orderBy, pageSize, fields: FIELDS,
    supportsAllDrives: true, includeItemsFromAllDrives: true,
  };
  if (append && listToken) params.pageToken = listToken;

  try {
    const data = await api('files', params, { signal: listAbort.signal });
    const items = normalize(data.files || []);
    renderItems(items);
    listToken = noMore ? null : (data.nextPageToken || null);
    $('#more').hidden = !listToken;
    const empty = !append && !items.length;
    setStatus(empty ? (loc.kind === 'search' ? 'No matching PDFs or folders.' : 'No folders or PDFs here.') : '');
  } catch (e) {
    if (e.name === 'AbortError') return;
    setStatus(e.message, true);
  }
}

function fmtSize(bytes) {
  const n = Number(bytes);
  if (!n) return '';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderItems(items) {
  const frag = document.createDocumentFragment();
  for (const it of items) {
    const isFolder = it.mimeType === MIME.folder;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item';

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = isFolder ? '📁' : '📄';

    const text = document.createElement('span');
    text.className = 'text';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = it.name;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = [isFolder ? 'Folder' : fmtSize(it.size), fmtDate(it.modifiedTime)].filter(Boolean).join(' · ');
    text.append(name, meta);

    btn.append(icon, text);
    btn.onclick = () => (isFolder ? openFolder(it) : openPdf(it));
    li.append(btn);
    frag.append(li);
  }
  $('#list').append(frag);
}

function openFolder(it) {
  stack.push({ kind: 'folder', id: it.id, name: it.name });
  saveStack();
  history.pushState({ nav: true }, '');
  loadList();
}

function renderResume() {
  const last = store.get('lastFile');
  const btn = $('#resume');
  if (!last) { btn.hidden = true; return; }
  const page = (store.get('pos', {}) || {})[last.id];
  btn.textContent = `▶ Continue reading: ${last.name}${page ? ` — page ${page}` : ''}`;
}

// ================== VIEWER ==================
let pdfjsLib = null;
async function loadPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import(PDFJS_BASE + 'pdf.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.mjs';
  }
  return pdfjsLib;
}

const V = { pdf: null, file: null, scale: 1, fit: true, abort: null, io: null, cur: 1 };

function vStatus(msg, isError = false, withDriveLink = false) {
  const el = $('#vStatus');
  el.replaceChildren();
  el.classList.toggle('error', isError);
  if (!msg) return;
  el.append(msg);
  if (withDriveLink && V.file) {
    const a = document.createElement('a');
    a.href = `https://drive.google.com/file/d/${V.file.id}/view`;
    a.target = '_blank'; a.rel = 'noopener';
    a.textContent = ' Open it in Google Drive instead.';
    el.append(a);
  }
}

function setProgress(frac) {
  $('#progressBar').style.width = frac == null ? '0' : `${Math.round(frac * 100)}%`;
}

async function readWithProgress(res, expected) {
  const total = Number(res.headers.get('Content-Length')) || expected;
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    if (total) setProgress(Math.min(1, got / total));
    vStatus(`Downloading… ${fmtSize(got) || '0 KB'}${total ? ' of ' + fmtSize(total) : ''}`);
  }
  const out = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

async function openPdf(file, pushHistory = true) {
  if (pushHistory) history.pushState({ viewer: true }, '');
  show('viewer');
  closeDoc();
  V.file = file;
  V.fit = true;
  $('#docTitle').textContent = file.name;
  $('#pageCount').textContent = '–';
  $('#pageInput').value = 1;
  $('#driveLink').href = `https://drive.google.com/file/d/${file.id}/view`;
  setProgress(0);
  vStatus('Downloading…');

  V.abort = new AbortController();
  const { signal } = V.abort;
  try {
    const libP = loadPdfJs();
    const res = await api(`files/${encodeURIComponent(file.id)}`, { alt: 'media', supportsAllDrives: true }, { raw: true, signal });
    const data = await readWithProgress(res, Number(file.size) || 0);
    const lib = await libP;
    if (signal.aborted) return;
    vStatus('Opening…');

    const task = lib.getDocument({ data });
    task.onPassword = (update, reason) => {
      const pw = window.prompt(reason === 2 ? 'Wrong password. Try again:' : 'This PDF is password-protected. Enter password:');
      if (pw == null) task.destroy(); else update(pw);
    };
    const pdf = await task.promise;
    if (signal.aborted) { pdf.destroy(); return; }

    V.pdf = pdf;
    $('#pageCount').textContent = pdf.numPages;
    $('#pageInput').max = pdf.numPages;
    store.set('lastFile', { id: file.id, name: file.name, size: file.size });

    await layout();
    const saved = (store.get('pos', {}) || {})[file.id];
    goToPage(clamp(saved || 1, 1, pdf.numPages));
    vStatus('');
    setProgress(null);
  } catch (e) {
    if (e?.name === 'AbortError' || signal.aborted) return;
    setProgress(null);
    const msg = e?.name === 'PasswordException' ? 'Could not open: password required.' : `Could not open this PDF. ${e?.message || ''}`;
    vStatus(msg, true, true);
  }
}

function closeDoc() {
  V.abort?.abort();
  V.io?.disconnect();
  V.io = null;
  V.pdf?.destroy();
  V.pdf = null;
  V.cur = 1;
  $('#pageWrap').replaceChildren();
}

function closeViewer() {
  closeDoc();
  V.file = null;
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  show('browser');
  renderResume();
  $('#resume').hidden = !(stack.length === 1 && stack[0].kind === 'folder' && store.get('lastFile'));
}

async function layout() {
  const pdf = V.pdf;
  if (!pdf) return;
  V.io?.disconnect();
  const box = $('#pages');
  const wrap = $('#pageWrap');
  const base = (await pdf.getPage(1)).getViewport({ scale: 1 });
  if (pdf !== V.pdf) return;
  if (V.fit) V.scale = clamp((box.clientWidth - 24) / base.width, 0.1, 5);
  $('#zoomLabel').textContent = V.fit ? 'Fit' : `${Math.round(V.scale * 100)}%`;

  const w = Math.floor(base.width * V.scale);
  const h = Math.floor(base.height * V.scale);
  const frag = document.createDocumentFragment();
  for (let n = 1; n <= pdf.numPages; n++) {
    const d = document.createElement('div');
    d.className = 'page';
    d.dataset.n = n;
    d.style.width = w + 'px';
    d.style.height = h + 'px';
    frag.append(d);
  }
  wrap.replaceChildren(frag);

  V.io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.isIntersecting ? renderPage : unrenderPage)(e.target);
  }, { root: box, rootMargin: '150% 0px' });
  for (const d of wrap.children) V.io.observe(d);
}

async function renderPage(div) {
  if (div.dataset.state) return;           // 'busy' or 'done'
  div.dataset.state = 'busy';
  const pdf = V.pdf;
  const scale = V.scale;
  try {
    const page = await pdf.getPage(Number(div.dataset.n));
    if (!div.isConnected || pdf !== V.pdf) return;
    const vp = page.getViewport({ scale });
    // Keep canvases under ~16 MP so Android doesn't run out of memory.
    const out = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16e6 / (vp.width * vp.height)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width * out);
    canvas.height = Math.floor(vp.height * out);
    canvas.style.width = Math.floor(vp.width) + 'px';
    canvas.style.height = Math.floor(vp.height) + 'px';
    div.style.width = canvas.style.width;
    div.style.height = canvas.style.height;

    const task = page.render({
      canvasContext: canvas.getContext('2d'),
      viewport: vp,
      transform: out !== 1 ? [out, 0, 0, out, 0, 0] : null,
    });
    div._task = task;
    await task.promise;
    div._task = null;
    if (!div.isConnected) return;
    div.replaceChildren(canvas);
    div.dataset.state = 'done';
  } catch (e) {
    div._task = null;
    div.dataset.state = '';
    if (e?.name !== 'RenderingCancelledException') console.error(e);
  }
}

function unrenderPage(div) {
  if (div._task) { div._task.cancel(); div._task = null; }
  if (div.firstChild) div.replaceChildren();
  div.dataset.state = '';
}

function savePos(n) {
  if (!V.file) return;
  const pos = store.get('pos', {}) || {};
  delete pos[V.file.id];
  pos[V.file.id] = n;
  const keys = Object.keys(pos);
  if (keys.length > 200) for (const k of keys.slice(0, keys.length - 200)) delete pos[k];
  store.set('pos', pos);
}

function updateCurrentPage() {
  const pages = $('#pageWrap').children;
  if (!pages.length) return;
  const box = $('#pages');
  const mark = box.scrollTop + box.clientHeight * 0.35;
  let lo = 0, hi = pages.length - 1, ans = 0;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (pages[m].offsetTop <= mark) { ans = m; lo = m + 1; } else hi = m - 1;
  }
  const n = ans + 1;
  if (n !== V.cur) {
    V.cur = n;
    if (document.activeElement !== $('#pageInput')) $('#pageInput').value = n;
    savePos(n);
  }
}

function goToPage(n) {
  const d = $('#pageWrap').children[n - 1];
  if (!d) return;
  $('#pages').scrollTop = d.offsetTop - 8;
  V.cur = n;
  $('#pageInput').value = n;
  savePos(n);
}

function zoomTo(newScale, anchor) {
  if (!V.pdf) return;
  const box = $('#pages');
  const old = V.scale;
  newScale = clamp(newScale, 0.25, 5);
  if (Math.abs(newScale - old) < 0.001 && !V.fit) return;
  const ax = anchor?.x ?? box.clientWidth / 2;
  const ay = anchor?.y ?? box.clientHeight / 2;
  const cx = box.scrollLeft + ax;
  const cy = box.scrollTop + ay;
  V.fit = false;
  V.scale = newScale;
  layout().then(() => {
    const f = newScale / old;
    box.scrollLeft = cx * f - ax;
    box.scrollTop = cy * f - ay;
    updateCurrentPage();
  });
}

function fitWidth() {
  if (!V.pdf) return;
  const page = V.cur;
  V.fit = true;
  layout().then(() => goToPage(page));
}

// Two-finger pinch zoom on the page area.
function setupPinch() {
  const box = $('#pages');
  const wrap = $('#pageWrap');
  let pinch = null;
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  box.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 2 || !V.pdf) return;
    const [a, b] = e.touches;
    const r = box.getBoundingClientRect();
    pinch = {
      d0: dist(a, b),
      mx: (a.clientX + b.clientX) / 2 - r.left,
      my: (a.clientY + b.clientY) / 2 - r.top,
      f: 1,
    };
    wrap.style.transformOrigin = `${box.scrollLeft + pinch.mx}px ${box.scrollTop + pinch.my - 12}px`;
  }, { passive: true });

  box.addEventListener('touchmove', (e) => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    const [a, b] = e.touches;
    pinch.f = clamp(dist(a, b) / pinch.d0, 0.25 / V.scale, 5 / V.scale);
    wrap.style.transform = `scale(${pinch.f})`;
  }, { passive: false });

  const end = (e) => {
    if (!pinch || e.touches.length >= 2) return;
    const p = pinch;
    pinch = null;
    wrap.style.transform = '';
    if (Math.abs(p.f - 1) > 0.02) zoomTo(V.scale * p.f, { x: p.mx, y: p.my });
  };
  box.addEventListener('touchend', end);
  box.addEventListener('touchcancel', end);
}

// ================== WIRING ==================
function wireUp() {
  $('#signinBtn').onclick = () => {
    $('#signinMsg').textContent = '';
    if (!tokenClient) return;
    requestToken(store.get('signedInBefore') ? '' : 'consent')
      .then(enterBrowser)
      .catch((e) => { $('#signinMsg').textContent = e.message; });
  };

  $('#signoutBtn').onclick = () => {
    if (token) try { google.accounts.oauth2.revoke(token, () => {}); } catch { /* ignore */ }
    token = null; tokenExp = 0;
    session.del('tok');
    store.del('signedInBefore');
    $('#signinBtn').textContent = 'Sign in with Google';
    show('signin');
  };

  $('#reconnectBtn').onclick = () => {
    requestToken('').then(() => {
      $('#reconnect').hidden = true;
      if (!$('#viewer').hidden && V.file && !V.pdf) openPdf(V.file, false);
      else if (!$('#browser').hidden) loadList();
    }).catch(() => {});
  };

  document.querySelectorAll('.tabs button').forEach((b) => {
    b.onclick = () => { stack = [ROOTS[b.dataset.tab]]; saveStack(); loadList(); };
  });

  $('#searchForm').onsubmit = (e) => {
    e.preventDefault();
    const text = $('#searchInput').value.trim();
    if (!text) return;
    $('#searchInput').blur();
    stack = [{ kind: 'search', text, name: `Search: “${text}”` }];
    saveStack();
    loadList();
  };

  $('#more').onclick = () => loadList(true);
  $('#resume').onclick = () => { const f = store.get('lastFile'); if (f) openPdf(f); };

  // Viewer controls
  $('#backBtn').onclick = () => history.back();
  $('#zoomIn').onclick = () => zoomTo(V.scale * 1.25);
  $('#zoomOut').onclick = () => zoomTo(V.scale / 1.25);
  $('#fitBtn').onclick = fitWidth;
  $('#pageInput').onchange = (e) => {
    if (!V.pdf) return;
    goToPage(clamp(parseInt(e.target.value, 10) || 1, 1, V.pdf.numPages));
    e.target.blur();
  };
  $('#nightBtn').onclick = () => {
    const on = !$('#viewer').classList.contains('night');
    $('#viewer').classList.toggle('night', on);
    $('#nightBtn').classList.toggle('on', on);
    store.set('night', on);
  };
  if (store.get('night')) { $('#viewer').classList.add('night'); $('#nightBtn').classList.add('on'); }
  $('#fsBtn').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  let raf = 0;
  $('#pages').addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; updateCurrentPage(); });
  }, { passive: true });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (V.pdf && V.fit) fitWidth(); }, 250);
  });

  // Android back button / gesture
  window.addEventListener('popstate', () => {
    if (!$('#viewer').hidden) { closeViewer(); return; }
    if (stack.length > 1) { stack.pop(); saveStack(); loadList(); }
  });

  setupPinch();
}

async function start() {
  wireUp();
  show('signin');

  if (CLIENT_ID.startsWith('PASTE_')) {
    $('#signinMsg').textContent = 'Setup needed: put your Google OAuth Client ID in app.js (see README).';
    $('#signinBtn').disabled = true;
    return;
  }
  try {
    await waitForGis();
    initTokenClient();
  } catch (e) {
    $('#signinMsg').textContent = e.message;
    return;
  }

  const saved = session.get('tok');
  if (saved?.token && Date.now() < saved.tokenExp) {
    token = saved.token; tokenExp = saved.tokenExp;
    enterBrowser();
  } else if (store.get('signedInBefore')) {
    $('#signinBtn').textContent = 'Continue with Google';
  }
}

start();
