// ui.js — rendering and event wiring. This is the only module that
// touches the DOM. It calls into subjects.js / attendance.js / reports.js
// / storage.js for everything else; it never reads or writes localStorage
// directly.

import * as subjectsApi from './subjects.js';
import * as attendanceApi from './attendance.js';
import * as reportsApi from './reports.js';
import * as storage from './storage.js';
import { STATUSES, STATUS_LIST, DEFAULT_STATUS } from './constants.js';

// ---------- small helpers ----------

function $(id) { return document.getElementById(id); }

function todayIso() {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function formatDateDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function formatPercentage(n) {
  return `${n.toFixed(1)}%`;
}

function statusPill(status) {
  const cls = status === 'Present' ? 'status-present' : 'status-absent';
  return `<span class="status-pill ${cls}">${STATUSES[status]?.label || status}</span>`;
}

function buildStatusChoice(container, name, selected) {
  container.innerHTML = STATUS_LIST.map((status) => `
    <label>
      <input type="radio" name="${name}" value="${status}" ${status === selected ? 'checked' : ''} />
      ${STATUSES[status].label}
    </label>
  `).join('');
}

function getCheckedStatus(container) {
  const checked = container.querySelector('input[type="radio"]:checked');
  return checked ? checked.value : null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ---------- toast ----------

let toastTimer = null;
function showToast(message, isError = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = 'toast' + (isError ? ' toast-error' : '');
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

// ---------- generic confirm dialog ----------

function confirmDialog(title, message, { confirmLabel = 'Confirm', danger = true } = {}) {
  return new Promise((resolve) => {
    const dialog = $('confirmDialog');
    $('confirmTitle').textContent = title;
    $('confirmMessage').textContent = message;
    const okBtn = $('confirmOkBtn');
    okBtn.textContent = confirmLabel;
    okBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

    const cleanup = (result) => {
      dialog.close();
      okBtn.onclick = null;
      $('confirmCancelBtn').onclick = null;
      resolve(result);
    };
    okBtn.onclick = () => cleanup(true);
    $('confirmCancelBtn').onclick = () => cleanup(false);
    dialog.addEventListener('cancel', () => cleanup(false), { once: true });
    dialog.showModal();
  });
}

function duplicateDialog(message) {
  return new Promise((resolve) => {
    const dialog = $('duplicateDialog');
    $('duplicateMessage').textContent = message;
    const cleanup = (result) => {
      dialog.close();
      $('duplicateEditBtn').onclick = null;
      $('duplicateCancelBtn').onclick = null;
      resolve(result);
    };
    $('duplicateEditBtn').onclick = () => cleanup(true);
    $('duplicateCancelBtn').onclick = () => cleanup(false);
    dialog.addEventListener('cancel', () => cleanup(false), { once: true });
    dialog.showModal();
  });
}

// ---------- routing / view switching ----------

const VIEWS = ['dashboard', 'subjects', 'record', 'reports', 'data'];
let currentReportSubjectId = null;

export function showView(viewName, param) {
  if (!VIEWS.includes(viewName)) viewName = 'dashboard';

  for (const name of VIEWS) {
    $(`view-${name}`).hidden = name !== viewName;
  }
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === viewName);
  });

  // Close mobile nav after navigating
  $('spineNav').classList.remove('open');
  $('navToggle').setAttribute('aria-expanded', 'false');

  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'subjects') renderSubjects();
  if (viewName === 'record') renderRecordView();
  if (viewName === 'reports') renderReportsView(param || currentReportSubjectId);
  if (viewName === 'data') renderDataView();
}

// ---------- Dashboard ----------

function renderDashboard() {
  const summary = reportsApi.computeOverallSummary();
  const empty = $('dashboardEmpty');
  const content = $('dashboardContent');

  if (summary.subjectCount === 0) {
    empty.hidden = false;
    content.hidden = true;
    return;
  }
  empty.hidden = true;
  content.hidden = false;

  $('overallStrip').innerHTML = `
    <div><dt>Subjects</dt><dd>${summary.subjectCount}</dd></div>
    <div><dt>Total Classes</dt><dd>${summary.total}</dd></div>
    <div><dt>Present</dt><dd class="figure-present">${summary.present}</dd></div>
    <div><dt>Absent</dt><dd class="figure-absent">${summary.absent}</dd></div>
    <div><dt>Attendance</dt><dd>${formatPercentage(summary.percentage)}</dd></div>
  `;

  const rows = reportsApi.computeSubjectWiseSummary();
  const tbody = $('subjectSummaryTable').querySelector('tbody');
  tbody.innerHTML = rows.map((r) => `
    <tr class="row-link" data-subject-id="${r.subjectId}">
      <td>${escapeHtml(r.name)}${r.code ? ` <span style="color:var(--ink-faint)">(${escapeHtml(r.code)})</span>` : ''}</td>
      <td class="num">${r.total}</td>
      <td class="num">${r.present}</td>
      <td class="num">${r.absent}</td>
      <td class="num percentage-cell">${formatPercentage(r.percentage)}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr').forEach((row) => {
    row.addEventListener('click', () => {
      currentReportSubjectId = row.dataset.subjectId;
      window.location.hash = `#reports/${currentReportSubjectId}`;
    });
  });
}

// ---------- Subjects ----------

let editingSubjectId = null;

function renderSubjects() {
  const subjects = subjectsApi.listSubjects();
  $('subjectsEmpty').hidden = subjects.length > 0;
  $('subjectsTable').hidden = subjects.length === 0;

  const tbody = $('subjectsTable').querySelector('tbody');
  tbody.innerHTML = subjects.map((s) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.code)}</td>
      <td>${escapeHtml(s.description)}</td>
      <td class="num">${subjectsApi.countAttendanceForSubject(s.id)}</td>
      <td class="actions-cell">
        <button class="btn-link" data-action="edit" data-id="${s.id}">Edit</button>
        <button class="btn-link danger" data-action="delete" data-id="${s.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => openSubjectDialog(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', () => handleDeleteSubject(btn.dataset.id));
  });
}

function openSubjectDialog(subjectId = null) {
  editingSubjectId = subjectId;
  const dialog = $('subjectDialog');
  const form = $('subjectForm');
  form.reset();
  $('subjectFormError').hidden = true;

  if (subjectId) {
    const subject = subjectsApi.getSubjectById(subjectId);
    $('subjectDialogTitle').textContent = 'Edit subject';
    $('subjectFormSubmit').textContent = 'Save changes';
    $('subjectName').value = subject.name;
    $('subjectCode').value = subject.code;
    $('subjectDescription').value = subject.description;
  } else {
    $('subjectDialogTitle').textContent = 'Add subject';
    $('subjectFormSubmit').textContent = 'Add subject';
  }
  dialog.showModal();
}

async function handleDeleteSubject(subjectId) {
  const subject = subjectsApi.getSubjectById(subjectId);
  const recordCount = subjectsApi.countAttendanceForSubject(subjectId);
  const message = recordCount > 0
    ? `Delete "${subject.name}"? This subject has ${recordCount} attendance record${recordCount === 1 ? '' : 's'} — deleting it will also delete those records. This cannot be undone.`
    : `Delete "${subject.name}"? This cannot be undone.`;

  const confirmed = await confirmDialog('Delete subject', message, { confirmLabel: 'Delete' });
  if (!confirmed) return;

  subjectsApi.deleteSubject(subjectId, { cascade: true });
  showToast('Subject deleted successfully.');
  renderSubjects();
}

function wireSubjectForm() {
  $('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      name: $('subjectName').value,
      code: $('subjectCode').value,
      description: $('subjectDescription').value,
    };
    const result = editingSubjectId
      ? subjectsApi.updateSubject(editingSubjectId, payload)
      : subjectsApi.addSubject(payload);

    if (!result.success) {
      const errEl = $('subjectFormError');
      errEl.textContent = result.errors.join(' ');
      errEl.hidden = false;
      return;
    }
    $('subjectDialog').close();
    showToast(editingSubjectId ? 'Subject updated successfully.' : 'Subject added successfully.');
    renderSubjects();
    populateSubjectSelects();
  });

  $('addSubjectBtn').addEventListener('click', () => openSubjectDialog(null));
}

// Keeps the Record and Reports subject dropdowns in sync with the subject list.
function populateSubjectSelects() {
  const subjects = subjectsApi.listSubjects();
  const options = subjects.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}${s.code ? ` (${escapeHtml(s.code)})` : ''}</option>`).join('');

  const recordSelect = $('recordSubject');
  const prevRecordValue = recordSelect.value;
  recordSelect.innerHTML = options;
  if (subjects.some((s) => s.id === prevRecordValue)) recordSelect.value = prevRecordValue;

  const reportSelect = $('reportSubjectSelect');
  const prevReportValue = reportSelect.value;
  reportSelect.innerHTML = options;
  if (subjects.some((s) => s.id === prevReportValue)) reportSelect.value = prevReportValue;
}

// ---------- Record Attendance ----------

function renderRecordView() {
  const subjects = subjectsApi.listSubjects();
  $('recordNoSubjects').hidden = subjects.length > 0;
  $('recordForm').hidden = subjects.length === 0;
  if (subjects.length === 0) return;

  populateSubjectSelects();
  if (!$('recordDate').value) $('recordDate').value = todayIso();
  buildStatusChoice($('recordStatusChoice'), 'recordStatus', DEFAULT_STATUS);
}

async function handleRecordSubmit(e) {
  e.preventDefault();
  const subjectId = $('recordSubject').value;
  const date = $('recordDate').value;
  const status = getCheckedStatus($('recordStatusChoice'));
  const remarks = $('recordRemarks').value;

  const existing = attendanceApi.findExistingRecord(subjectId, date);
  if (existing) {
    const subjectName = subjectsApi.getSubjectById(subjectId)?.name || 'this subject';
    const wantsEdit = await duplicateDialog(
      `Attendance already exists for ${subjectName} on ${formatDateDisplay(date)}. Do you want to edit the existing record?`
    );
    if (wantsEdit) openAttendanceEditDialog(existing.id);
    return;
  }

  const result = attendanceApi.addAttendance({ subjectId, date, status, remarks });
  if (!result.success) {
    showToast(result.errors.join(' '), true);
    return;
  }
  showToast('Attendance recorded successfully.');
  lastSavedAttendanceId = result.record.id;
  $('recordRemarks').value = '';
  buildStatusChoice($('recordStatusChoice'), 'recordStatus', DEFAULT_STATUS);
}

// ---------- Reports ----------

let lastSavedAttendanceId = null;

function renderReportsView(subjectId) {
  const subjects = subjectsApi.listSubjects();
  $('reportsNoSubjects').hidden = subjects.length > 0;
  $('reportsContent').hidden = subjects.length === 0;
  if (subjects.length === 0) return;

  populateSubjectSelects();

  const targetId = subjects.some((s) => s.id === subjectId) ? subjectId : subjects[0].id;
  $('reportSubjectSelect').value = targetId;
  currentReportSubjectId = targetId;
  renderReportBody(targetId);
}

function renderReportBody(subjectId) {
  currentReportSubjectId = subjectId;
  const subject = subjectsApi.getSubjectById(subjectId);
  $('reportBody').hidden = !subject;
  if (!subject) return;

  const stats = reportsApi.computeSubjectStats(subjectId);

  $('reportStrip').innerHTML = `
    <div><dt>Total Classes</dt><dd>${stats.total}</dd></div>
    <div><dt>Present</dt><dd class="figure-present">${stats.present}</dd></div>
    <div><dt>Absent</dt><dd class="figure-absent">${stats.absent}</dd></div>
    <div><dt>Attendance</dt><dd>${formatPercentage(stats.percentage)}</dd></div>
  `;

  const tbody = $('reportTable').querySelector('tbody');
  $('reportEmpty').hidden = stats.records.length > 0;
  $('reportTable').hidden = stats.records.length === 0;

  tbody.innerHTML = stats.records.map((r) => `
    <tr data-id="${r.id}">
      <td>${formatDateDisplay(r.date)}</td>
      <td>${statusPill(r.status)}</td>
      <td>${escapeHtml(r.remarks)}</td>
      <td class="actions-cell">
        <button class="btn-link" data-action="edit" data-id="${r.id}">Edit</button>
        <button class="btn-link danger" data-action="delete" data-id="${r.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => openAttendanceEditDialog(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', () => handleDeleteAttendance(btn.dataset.id));
  });

  if (lastSavedAttendanceId) {
    const row = tbody.querySelector(`tr[data-id="${lastSavedAttendanceId}"]`);
    if (row) row.classList.add('row-enter');
    lastSavedAttendanceId = null;
  }
}

async function handleDeleteAttendance(id) {
  const confirmed = await confirmDialog(
    'Delete attendance record',
    'Are you sure you want to delete this attendance record? This cannot be undone.',
    { confirmLabel: 'Delete' }
  );
  if (!confirmed) return;

  attendanceApi.deleteAttendance(id);
  showToast('Attendance deleted successfully.');
  if (currentReportSubjectId) renderReportBody(currentReportSubjectId);
  if (!$('view-dashboard').hidden) renderDashboard();
}

let editingAttendanceId = null;

function openAttendanceEditDialog(id) {
  editingAttendanceId = id;
  const record = attendanceApi.getAttendanceById(id);
  if (!record) return;
  $('attendanceFormError').hidden = true;
  $('editDate').value = record.date;
  buildStatusChoice($('editStatusChoice'), 'editStatus', record.status);
  $('editRemarks').value = record.remarks;
  $('attendanceDialog').showModal();
}

function wireAttendanceEditForm() {
  $('attendanceEditForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = $('editDate').value;
    const status = getCheckedStatus($('editStatusChoice'));
    const remarks = $('editRemarks').value;

    const result = attendanceApi.updateAttendance(editingAttendanceId, { date, status, remarks });
    if (!result.success) {
      const errEl = $('attendanceFormError');
      const msg = result.errors.includes('DUPLICATE')
        ? 'Another record already exists for this subject on this date.'
        : result.errors.filter((e) => e !== 'DUPLICATE').join(' ');
      errEl.textContent = msg;
      errEl.hidden = false;
      return;
    }
    $('attendanceDialog').close();
    showToast('Attendance updated successfully.');
    lastSavedAttendanceId = editingAttendanceId;
    if (currentReportSubjectId) renderReportBody(currentReportSubjectId);
    if (!$('view-dashboard').hidden) renderDashboard();
    if (!$('view-record').hidden) renderRecordView();
  });
}

// ---------- Data Management ----------

function renderDataView() {
  const lastExported = storage.getLastExportedAt();
  $('lastExportedNote').textContent = lastExported
    ? `Last exported: ${new Date(lastExported).toLocaleString()}`
    : 'You have not exported a backup yet.';
  $('importFile').value = '';
  $('importBtn').disabled = true;
}

function handleExport() {
  const backup = storage.buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `attendance-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  storage.markExported();
  renderDataView();
  showToast('Backup exported successfully.');
}

async function handleImport() {
  const fileInput = $('importFile');
  const file = fileInput.files[0];
  if (!file) return;

  let data;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch (err) {
    showToast('Unable to read this file. Make sure it is a valid JSON backup.', true);
    return;
  }

  const check = storage.validateBackupShape(data);
  if (!check.valid) {
    showToast(`Import failed: ${check.reason}`, true);
    return;
  }

  const confirmed = await confirmDialog(
    'Replace current data?',
    'Importing this file will replace the current attendance data in this browser. Do you want to continue?',
    { confirmLabel: 'Import' }
  );
  if (!confirmed) return;

  storage.restoreFromBackup(data);
  showToast('Data imported successfully.');
  populateSubjectSelects();
  showView('dashboard');
  window.location.hash = '#dashboard';
}

async function handleReset() {
  const firstConfirm = await confirmDialog(
    'Reset all data',
    'This will permanently delete all subjects and attendance records stored in this browser. Make sure you have exported a backup before continuing.',
    { confirmLabel: 'Continue' }
  );
  if (!firstConfirm) return;

  const secondConfirm = await confirmDialog(
    'This cannot be undone',
    'Are you absolutely sure? All subjects and attendance records will be permanently deleted.',
    { confirmLabel: 'Yes, delete everything' }
  );
  if (!secondConfirm) return;

  storage.resetAllData();
  showToast('All data has been reset.');
  populateSubjectSelects();
  showView('dashboard');
  window.location.hash = '#dashboard';
}

// ---------- init ----------

export function init() {
  // Mobile nav toggle
  $('navToggle').addEventListener('click', () => {
    const nav = $('spineNav');
    const isOpen = nav.classList.toggle('open');
    $('navToggle').setAttribute('aria-expanded', String(isOpen));
  });

  // Close any dialog via [data-close-dialog]
  document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('dialog').close());
  });

  wireSubjectForm();
  wireAttendanceEditForm();
  $('recordForm').addEventListener('submit', handleRecordSubmit);

  $('reportSubjectSelect').addEventListener('change', (e) => {
    currentReportSubjectId = e.target.value;
    window.location.hash = `#reports/${currentReportSubjectId}`;
  });

  $('exportBtn').addEventListener('click', handleExport);
  $('importFile').addEventListener('change', () => {
    $('importBtn').disabled = !$('importFile').files.length;
  });
  $('importBtn').addEventListener('click', handleImport);
  $('resetBtn').addEventListener('click', handleReset);

  populateSubjectSelects();
}
