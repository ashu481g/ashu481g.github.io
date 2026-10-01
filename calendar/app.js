// ---------- CONFIGURATION ----------
const CLIENT_ID   = '254731888816-nqo6vm79nuh59e3nfpuppofco9vl9t6v.apps.googleusercontent.com';
const API_KEY     = 'AIzaSyDTOUnq_T5RGkxnJmaihf0OnB9wrQdFBnE';   // restrict this key in Google Cloud (see steps)
const CALENDAR_ID = 'pgp41426@iiml.ac.in';
const OWNER_EMAIL = 'pgp41426@iiml.ac.in';                         // only this account may use the Owner View
const SCOPES      = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient = null;
let accessToken = null;

// ---------- TABS ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
    btn.classList.add('active');
  });
});

// ---------- 1. PUBLIC VIEW: free/busy only ----------
// Uses the Google Calendar freeBusy API, which returns ONLY busy time ranges.
// No titles, descriptions, places or attendees are ever downloaded to the visitor.
async function fetchPublicTimeline() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  const box = document.getElementById('public-timeline');

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: CALENDAR_ID }]
      })
    });
    const data = await res.json();
    const cal = data.calendars && data.calendars[CALENDAR_ID];
    if (!res.ok || !cal || (cal.errors && cal.errors.length)) {
      box.textContent = 'Availability is not public right now.';
      console.warn('freeBusy response:', data);
      return;
    }
    renderPublicTimeline(start, cal.busy || []);
  } catch (err) {
    box.textContent = 'Unable to load availability.';
  }
}

function renderPublicTimeline(startDate, busy) {
  const container = document.getElementById('public-timeline');
  container.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate); day.setDate(day.getDate() + i);
    const dayStart = new Date(day).setHours(0, 0, 0, 0);
    const dayEnd   = new Date(day).setHours(23, 59, 59, 999);

    const wrap = document.createElement('div'); wrap.className = 'day-container';
    const label = document.createElement('div'); label.className = 'day-label';
    label.textContent = day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const bar = document.createElement('div'); bar.className = 'timeline-bar';

    busy.forEach(b => {
      const s = new Date(b.start).getTime(), e = new Date(b.end).getTime();
      if (!(s < dayEnd && e > dayStart)) return;
      const startMin = Math.max(0, (s - dayStart) / 60000);
      const endMin   = Math.min(1440, (e - dayStart) / 60000);
      const block = document.createElement('div'); block.className = 'busy-block';
      block.style.left  = (startMin / 1440 * 100) + '%';
      block.style.width = ((endMin - startMin) / 1440 * 100) + '%';
      block.title = 'Busy';
      bar.appendChild(block);
    });

    const marks = document.createElement('div'); marks.className = 'hour-markers';
    ['12 AM', '6 AM', '12 PM', '6 PM', '11 PM'].forEach(t => {
      const sp = document.createElement('span'); sp.textContent = t; marks.appendChild(sp);
    });

    wrap.append(label, bar, marks);
    container.appendChild(wrap);
  }
}

// ---------- 2. OWNER VIEW: full details, owner account only ----------
function initGoogleSignIn() {
  if (!(window.google && google.accounts && google.accounts.oauth2)) {
    return setTimeout(initGoogleSignIn, 200);          // wait for Google's script
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async resp => {
      if (resp.error) return;
      accessToken = resp.access_token;
      setStatus('Checking account...');

      // Only the owner's account may see details. Anyone else is signed out at once.
      const who = await apiGet('https://www.googleapis.com/calendar/v3/calendars/primary');
      if (!who || (who.id || '').toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
        google.accounts.oauth2.revoke(accessToken);
        accessToken = null;
        setStatus('This view is only for the calendar owner. Please use the Public Availability tab.');
        return;
      }
      toggleButtons(true);
      setStatus('Loading schedule...');
      fetchPrivateSchedule();
    }
  });
}

async function apiGet(url) {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    return res.ok ? res.json() : null;
  } catch (e) { return null; }
}

function setStatus(msg) { document.getElementById('private-status').textContent = msg; }
function toggleButtons(signedIn) {
  document.getElementById('auth-btn').hidden = signedIn;
  document.getElementById('signout-btn').hidden = !signedIn;
}

document.getElementById('auth-btn').addEventListener('click', () => {
  if (tokenClient) tokenClient.requestAccessToken({ prompt: 'consent' });
});

document.getElementById('signout-btn').addEventListener('click', () => {
  if (!accessToken) return;
  google.accounts.oauth2.revoke(accessToken);
  accessToken = null;
  toggleButtons(false);
  document.getElementById('private-schedule').innerHTML = '';
  setStatus('Signed out.');
});

async function fetchPrivateSchedule() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const to   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59).toISOString();
  const data = await apiGet(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(from)}&timeMax=${encodeURIComponent(to)}&singleEvents=true&orderBy=startTime`);
  if (!data) return setStatus('Failed to load details.');
  renderPrivateSchedule(data.items || []);
}

function renderPrivateSchedule(events) {
  const container = document.getElementById('private-schedule');
  container.innerHTML = '';
  setStatus('');
  if (!events.length) { container.textContent = 'No events scheduled for the next 7 days.'; return; }

  events.forEach(ev => {
    const when = ev.start.dateTime
      ? new Date(ev.start.dateTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'All day';
    const card = document.createElement('div'); card.className = 'card';
    const t = document.createElement('div'); t.className = 'time'; t.textContent = '⏰ ' + when;
    const h = document.createElement('div'); h.className = 'title'; h.textContent = ev.summary || 'Untitled event';
    card.append(t, h);
    if (ev.description) {
      const d = document.createElement('div'); d.className = 'desc';
      // Google descriptions can contain HTML; show them as plain text
      const doc = new DOMParser().parseFromString(ev.description.replace(/<br\s*\/?>/gi, '\n'), 'text/html');
      d.textContent = doc.body.textContent;
      card.appendChild(d);
    }
    container.appendChild(card);
  });
}

// ---------- START ----------
fetchPublicTimeline();
initGoogleSignIn();
