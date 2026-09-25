// app.js — bootstraps the app and does simple hash-based routing between
// the five views. Route shapes:
//   #dashboard
//   #subjects
//   #record
//   #reports            (uses the currently selected / first subject)
//   #reports/<subjectId> (jumps straight to that subject's report)
//   #data
//
// Startup order: check config -> sign in -> load data from Supabase ->
// (one-time) offer to move old browser-only data up -> start the UI.

import * as ui from './ui.js';
import * as storage from './storage.js';
import { isConfigured } from './supabaseClient.js';
import {
  ensureSignedIn, showLoading, showFatal, hideOverlay,
  mountAccountBox, signOut, showSyncBanner,
} from './auth.js';

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  const [view, param] = hash.split('/');
  return { view: view || 'dashboard', param };
}

function handleRouteChange() {
  const { view, param } = currentRoute();
  ui.showView(view, param);
}

// If this browser still holds data from the old localStorage-only version
// and the account on the server is empty, offer to upload it once.
async function maybeMigrateLegacyData() {
  const legacy = storage.getLegacyLocalData();
  if (!legacy || !storage.isEmpty()) return;

  const ok = window.confirm(
    `This browser has data from the old version of the app ` +
    `(${legacy.subjects.length} subjects, ${legacy.attendance.length} attendance records).\n\n` +
    `Upload it to your account so every device can see it?`
  );
  if (!ok) return;

  showLoading('Uploading your old data…');
  const saved = await storage.restoreFromBackup(legacy);
  if (saved) {
    storage.clearLegacyLocalData();
  } else {
    window.alert('Upload failed. Your old data is still in this browser; reload to try again.');
  }
}

// When you come back to this tab (e.g. after marking attendance on your
// phone), pull fresh data — unless you're mid-way through a form.
function wireRefreshOnReturn() {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    if (storage.hasPendingWrites()) return;
    if (currentRoute().view === 'record') return;
    if (document.querySelector('dialog[open]')) return;
    try {
      await storage.load();
      ui.populateSubjectSelects();
      handleRouteChange();
    } catch (err) {
      console.warn('Background refresh failed', err);
    }
  });
}

async function boot() {
  if (!isConfigured()) {
    showFatal(
      'Setup needed',
      'Supabase is not configured yet. Put your Project URL and publishable key in js/config.js, commit, and reload.'
    );
    return;
  }

  let session;
  try {
    session = await ensureSignedIn();
  } catch (err) {
    showFatal('Could not reach the server', err.message || String(err));
    return;
  }

  showLoading();
  try {
    await storage.load();
  } catch (err) {
    showFatal('Could not load your data', err.message || String(err));
    return;
  }

  await maybeMigrateLegacyData();
  hideOverlay();

  mountAccountBox(session.user.email, { onSignOut: signOut });
  window.addEventListener('sync-error', (e) => showSyncBanner(e.detail.message));
  window.addEventListener('beforeunload', (e) => {
    if (storage.hasPendingWrites()) { e.preventDefault(); e.returnValue = ''; }
  });

  ui.init();
  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  }
  handleRouteChange();
  window.addEventListener('hashchange', handleRouteChange);
  wireRefreshOnReturn();
}

document.addEventListener('DOMContentLoaded', boot);
