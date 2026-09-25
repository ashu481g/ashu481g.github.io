// auth.js — sign-in screen, loading/error screens, account box, and the
// "couldn't save" banner. Kept separate from ui.js so the existing views
// don't need to know anything about accounts.

import { supabase } from './supabaseClient.js';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

let overlay = null;

function showOverlay(inner) {
  if (!overlay) {
    overlay = el('<div class="auth-overlay" role="dialog" aria-modal="true"><div class="auth-card"></div></div>');
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.auth-card').innerHTML = inner;
  overlay.hidden = false;
  return overlay.querySelector('.auth-card');
}

export function hideOverlay() {
  if (overlay) overlay.hidden = true;
}

export function showLoading(message = 'Loading your register…') {
  showOverlay(`<h2>Attendance Register</h2><p class="auth-note">${message}</p>`);
}

export function showFatal(title, message) {
  const card = showOverlay(`
    <h2>${title}</h2>
    <p class="auth-note"></p>
    <button type="button" class="btn btn-primary" id="authRetry">Reload</button>`);
  card.querySelector('.auth-note').textContent = message;
  card.querySelector('#authRetry').addEventListener('click', () => location.reload());
}

// Resolves with a session: the saved one if this browser is already signed
// in, otherwise after the user signs in with email + password.
export async function ensureSignedIn() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  return new Promise((resolve) => {
    const card = showOverlay(`
      <h2>Attendance Register</h2>
      <p class="auth-note">Sign in to open your register.</p>
      <form id="authForm" novalidate>
        <label for="authEmail">Email</label>
        <input id="authEmail" type="email" autocomplete="username" required />
        <label for="authPassword">Password</label>
        <input id="authPassword" type="password" autocomplete="current-password" required />
        <p class="auth-error" id="authError" hidden></p>
        <button type="submit" class="btn btn-primary" id="authSubmit">Sign in</button>
      </form>`);

    const form = card.querySelector('#authForm');
    const errorEl = card.querySelector('#authError');
    const submit = card.querySelector('#authSubmit');
    card.querySelector('#authEmail').focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      submit.disabled = true;
      submit.textContent = 'Signing in…';

      const { data: result, error } = await supabase.auth.signInWithPassword({
        email: card.querySelector('#authEmail').value.trim(),
        password: card.querySelector('#authPassword').value,
      });

      if (error) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
        submit.disabled = false;
        submit.textContent = 'Sign in';
        return;
      }
      resolve(result.session);
    });
  });
}

// Small "signed in as … / Sign out" block at the bottom of the spine.
export function mountAccountBox(email, { onSignOut }) {
  const spine = document.querySelector('.spine');
  if (!spine || spine.querySelector('.spine-account')) return;
  const box = el(`
    <div class="spine-account">
      <span class="spine-account-email"></span>
      <button type="button" class="spine-signout">Sign out</button>
    </div>`);
  box.querySelector('.spine-account-email').textContent = email;
  box.querySelector('.spine-signout').addEventListener('click', onSignOut);
  spine.appendChild(box);
}

export async function signOut() {
  await supabase.auth.signOut();
  location.reload();
}

// Persistent warning shown when a background save to Supabase fails.
export function showSyncBanner(message) {
  let banner = document.getElementById('syncBanner');
  if (!banner) {
    banner = el(`
      <div class="sync-banner" id="syncBanner" role="alert">
        <span class="sync-banner-text"></span>
        <button type="button" class="sync-banner-btn">Reload</button>
      </div>`);
    banner.querySelector('.sync-banner-btn').addEventListener('click', () => location.reload());
    document.body.appendChild(banner);
  }
  banner.querySelector('.sync-banner-text').textContent =
    `Your last change could not be saved to the server (${message}). Reload to see what is saved.`;
  banner.hidden = false;
}
