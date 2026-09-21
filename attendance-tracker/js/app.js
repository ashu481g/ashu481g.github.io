// app.js — bootstraps the app and does simple hash-based routing between
// the five views. Route shapes:
//   #dashboard
//   #subjects
//   #record
//   #reports            (uses the currently selected / first subject)
//   #reports/<subjectId> (jumps straight to that subject's report)
//   #data

import * as ui from './ui.js';

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  const [view, param] = hash.split('/');
  return { view: view || 'dashboard', param };
}

function handleRouteChange() {
  const { view, param } = currentRoute();
  ui.showView(view, param);
}

function boot() {
  ui.init();
  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  }
  handleRouteChange();
  window.addEventListener('hashchange', handleRouteChange);
}

document.addEventListener('DOMContentLoaded', boot);
