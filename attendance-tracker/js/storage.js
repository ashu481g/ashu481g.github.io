// storage.js — Data Access Layer
//
// This is the ONLY module that reads or writes localStorage directly.
// Every other module (subjects.js, attendance.js, reports.js, ui.js) goes
// through the functions exported here. That means swapping localStorage
// for a real backend later is a matter of rewriting this one file — the
// function names and return shapes are the contract the rest of the app
// depends on.
//
// GITHUB PAGES NOTE: localStorage is scoped to this browser + this site
// origin. It is NOT the attendance data living "in the repository" — it
// lives only on the device/browser you use the app from. Export a backup
// (Data Management > Export) whenever you want that data to be portable,
// recoverable, or usable on another device or browser.

import { STORAGE_KEYS, SCHEMA_VERSION } from './constants.js';

// ---------- internal helpers ----------

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${key} from localStorage`, err);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Failed to write ${key} to localStorage`, err);
    return false;
  }
}

function getMeta() {
  return readJSON(STORAGE_KEYS.META, { subjectCounter: 0, attendanceCounter: 0 });
}

function saveMeta(meta) {
  return writeJSON(STORAGE_KEYS.META, meta);
}

// Generates a readable, non-index-based ID: SUB001, SUB002, ... / ATT001, ...
// Counter lives in meta and only ever increments, so IDs stay unique even
// after deletions (never reused).
function nextId(prefix, counterField) {
  const meta = getMeta();
  meta[counterField] = (meta[counterField] || 0) + 1;
  saveMeta(meta);
  return `${prefix}${String(meta[counterField]).padStart(3, '0')}`;
}

// ---------- Subjects ----------

export function getSubjects() {
  return readJSON(STORAGE_KEYS.SUBJECTS, []);
}

export function saveSubjects(subjects) {
  return writeJSON(STORAGE_KEYS.SUBJECTS, subjects);
}

export function generateSubjectId() {
  return nextId('SUB', 'subjectCounter');
}

// ---------- Attendance ----------

export function getAttendance() {
  return readJSON(STORAGE_KEYS.ATTENDANCE, []);
}

export function saveAttendance(records) {
  return writeJSON(STORAGE_KEYS.ATTENDANCE, records);
}

export function generateAttendanceId() {
  return nextId('ATT', 'attendanceCounter');
}

// ---------- Export / Import ----------

// Produces the single backup object that gets downloaded as JSON.
export function buildBackup() {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    subjects: getSubjects(),
    attendance: getAttendance(),
  };
}

// Validates the shape of a parsed backup file before anything is written.
// Returns { valid: true } or { valid: false, reason: '...' }.
export function validateBackupShape(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'File does not contain a valid JSON object.' };
  }
  if (!Array.isArray(data.subjects) || !Array.isArray(data.attendance)) {
    return { valid: false, reason: 'File is missing "subjects" or "attendance" arrays.' };
  }
  if (typeof data.schemaVersion !== 'number') {
    return { valid: false, reason: 'File is missing a schemaVersion.' };
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    return { valid: false, reason: 'File was exported by a newer version of this app.' };
  }
  const subjectsOk = data.subjects.every(
    (s) => s && typeof s.id === 'string' && typeof s.name === 'string'
  );
  const attendanceOk = data.attendance.every(
    (a) => a && typeof a.id === 'string' && typeof a.subjectId === 'string' && typeof a.date === 'string' && typeof a.status === 'string'
  );
  if (!subjectsOk || !attendanceOk) {
    return { valid: false, reason: 'One or more records in the file are missing required fields.' };
  }
  return { valid: true };
}

// Replaces all current data with the contents of a validated backup.
// Also rebuilds the ID counters so future new records never collide with
// imported ones.
export function restoreFromBackup(data) {
  saveSubjects(data.subjects);
  saveAttendance(data.attendance);

  const maxSuffix = (records) =>
    records.reduce((max, r) => {
      const match = /^\D+(\d+)$/.exec(r.id || '');
      const n = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, n);
    }, 0);

  saveMeta({
    subjectCounter: maxSuffix(data.subjects),
    attendanceCounter: maxSuffix(data.attendance),
  });
}

// ---------- Reset ----------

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  localStorage.removeItem(STORAGE_KEYS.META);
}

export function getLastExportedAt() {
  return readJSON(STORAGE_KEYS.META, {}).lastExportedAt || null;
}

export function markExported() {
  const meta = getMeta();
  meta.lastExportedAt = new Date().toISOString();
  saveMeta(meta);
}
