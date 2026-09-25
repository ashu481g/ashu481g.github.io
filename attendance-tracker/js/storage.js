// storage.js — Data Access Layer (Supabase edition)
//
// Still the ONLY module that knows where data lives. The rest of the app
// calls the same synchronous functions as before (getSubjects(),
// saveAttendance(), ...), so subjects.js / attendance.js / reports.js did
// not need to change.
//
// How it works:
//   1. On startup, app.js calls `await load()`, which pulls all of the
//      signed-in user's rows from Supabase into an in-memory cache.
//   2. Getters read from that cache (instant, synchronous).
//   3. Savers update the cache immediately, work out what changed, and
//      push only those rows to Supabase in the background. Writes run one
//      at a time, in order, through a queue.
//   4. If a background write fails, a 'sync-error' event is fired on
//      window so the UI can tell the user.
//
// The database — not the browser — is now the source of truth, so every
// device you sign in from sees the same data.

import { supabase } from './supabaseClient.js';
import { STORAGE_KEYS, SCHEMA_VERSION } from './constants.js';

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

let cache = {
  subjects: [],
  attendance: [],
  meta: { subjectCounter: 0, attendanceCounter: 0, lastExportedAt: null },
};

// ---------- row <-> app-object mapping ----------

const subjectToRow = (s) => ({
  id: s.id,
  name: s.name,
  code: s.code || '',
  description: s.description || '',
  created_at: s.createdAt,
});
const rowToSubject = (r) => ({
  id: r.id,
  name: r.name,
  code: r.code,
  description: r.description,
  createdAt: r.created_at,
});
const attendanceToRow = (a) => ({
  id: a.id,
  subject_id: a.subjectId,
  date: a.date,
  status: a.status,
  remarks: a.remarks || '',
  created_at: a.createdAt,
  updated_at: a.updatedAt,
});
const rowToAttendance = (r) => ({
  id: r.id,
  subjectId: r.subject_id,
  date: r.date,
  status: r.status,
  remarks: r.remarks,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const metaToRow = (m) => ({
  subject_counter: m.subjectCounter || 0,
  attendance_counter: m.attendanceCounter || 0,
  last_exported_at: m.lastExportedAt || null,
});

const clone = (v) => structuredClone(v);

// ---------- background write queue ----------

let queue = Promise.resolve();
let pending = 0;

function check(result) {
  if (result && result.error) throw result.error;
  return result;
}

// Runs `task` after every earlier write has finished. Returns a promise
// that resolves to true on success and false on failure (never rejects).
function enqueue(label, task) {
  pending += 1;
  const run = queue.then(task).then(
    () => true,
    (err) => {
      console.error(`Supabase write failed (${label})`, err);
      window.dispatchEvent(
        new CustomEvent('sync-error', { detail: { label, message: err.message || String(err) } })
      );
      return false;
    }
  );
  queue = run.finally(() => { pending -= 1; });
  return run;
}

export function hasPendingWrites() {
  return pending > 0;
}

// Resolves once every queued write has finished.
export function flush() {
  return queue;
}

// Compares two lists of records by id and returns what must be written.
function diff(prevList, nextList) {
  const prevById = new Map(prevList.map((r) => [r.id, JSON.stringify(r)]));
  const nextIds = new Set(nextList.map((r) => r.id));
  const upserts = nextList.filter((r) => prevById.get(r.id) !== JSON.stringify(r));
  const deletes = prevList.filter((r) => !nextIds.has(r.id)).map((r) => r.id);
  return { upserts, deletes };
}

function chunk(arr, size = 500) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function pushChanges(table, toRow, upserts, deletes) {
  for (const ids of chunk(deletes)) {
    check(await supabase.from(table).delete().in('id', ids));
  }
  for (const rows of chunk(upserts)) {
    check(await supabase.from(table).upsert(rows.map(toRow), { onConflict: 'user_id,id' }));
  }
}

// ---------- initial load ----------

async function fetchAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

// Pulls everything for the signed-in user into the cache. Call on startup
// and whenever you want to pick up changes made on another device.
export async function load() {
  const [subjectRows, attendanceRows, metaResult] = await Promise.all([
    fetchAll('subjects', 'id,name,code,description,created_at'),
    fetchAll('attendance', 'id,subject_id,date,status,remarks,created_at,updated_at'),
    supabase.from('app_meta').select('subject_counter,attendance_counter,last_exported_at').maybeSingle(),
  ]);
  check(metaResult);

  cache.subjects = subjectRows.map(rowToSubject);
  cache.attendance = attendanceRows.map(rowToAttendance);
  const m = metaResult.data;
  cache.meta = {
    subjectCounter: m ? m.subject_counter : 0,
    attendanceCounter: m ? m.attendance_counter : 0,
    lastExportedAt: m ? m.last_exported_at : null,
  };
}

// ---------- meta / IDs ----------

function saveMeta(meta) {
  cache.meta = clone(meta);
  enqueue('meta', async () => {
    check(await supabase.from('app_meta').upsert(metaToRow(meta), { onConflict: 'user_id' }));
  });
  return true;
}

// Generates a readable, non-index-based ID: SUB001, SUB002, ... / ATT001, ...
// The counter only ever increments, so IDs are never reused after deletions.
// It is also never allowed to fall behind the highest existing ID.
function nextId(prefix, counterField, records) {
  const meta = clone(cache.meta);
  const next = Math.max((meta[counterField] || 0) + 1, maxSuffix(records) + 1);
  meta[counterField] = next;
  saveMeta(meta);
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function maxSuffix(records) {
  return records.reduce((max, r) => {
    const match = /^\D+(\d+)$/.exec(r.id || '');
    return Math.max(max, match ? parseInt(match[1], 10) : 0);
  }, 0);
}

// ---------- Subjects ----------

// Returns a copy: callers mutate the array and pass it back to saveSubjects().
export function getSubjects() {
  return clone(cache.subjects);
}

export function saveSubjects(subjects) {
  const prev = cache.subjects;
  cache.subjects = clone(subjects);
  const { upserts, deletes } = diff(prev, cache.subjects);
  if (upserts.length || deletes.length) {
    enqueue('subjects', () => pushChanges('subjects', subjectToRow, upserts, deletes));
  }
  return true;
}

export function generateSubjectId() {
  return nextId('SUB', 'subjectCounter', cache.subjects);
}

// ---------- Attendance ----------

export function getAttendance() {
  return clone(cache.attendance);
}

export function saveAttendance(records) {
  const prev = cache.attendance;
  cache.attendance = clone(records);
  const { upserts, deletes } = diff(prev, cache.attendance);
  if (upserts.length || deletes.length) {
    enqueue('attendance', () => pushChanges('attendance', attendanceToRow, upserts, deletes));
  }
  return true;
}

export function generateAttendanceId() {
  return nextId('ATT', 'attendanceCounter', cache.attendance);
}

// ---------- Export / Import ----------

export function buildBackup() {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    subjects: getSubjects(),
    attendance: getAttendance(),
  };
}

// Validates the shape of a parsed backup file before anything is written.
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

async function deleteEverythingRemote() {
  // PostgREST requires a filter on DELETE; RLS limits it to this user's rows.
  check(await supabase.from('attendance').delete().neq('id', ''));
  check(await supabase.from('subjects').delete().neq('id', ''));
}

// Replaces ALL of the user's data with a validated backup.
// Async: resolves to true when the server has the new data, false on failure.
export function restoreFromBackup(data) {
  const now = new Date().toISOString();
  const subjects = data.subjects.map((s) => ({
    id: s.id, name: s.name, code: s.code || '', description: s.description || '',
    createdAt: s.createdAt || now,
  }));
  const attendance = data.attendance.map((a) => ({
    id: a.id, subjectId: a.subjectId, date: a.date, status: a.status, remarks: a.remarks || '',
    createdAt: a.createdAt || now, updatedAt: a.updatedAt || a.createdAt || now,
  }));
  const meta = {
    ...cache.meta,
    subjectCounter: maxSuffix(subjects),
    attendanceCounter: maxSuffix(attendance),
  };

  cache.subjects = clone(subjects);
  cache.attendance = clone(attendance);
  cache.meta = clone(meta);

  return enqueue('restore', async () => {
    await deleteEverythingRemote();
    await pushChanges('subjects', subjectToRow, subjects, []);
    await pushChanges('attendance', attendanceToRow, attendance, []);
    check(await supabase.from('app_meta').upsert(metaToRow(meta), { onConflict: 'user_id' }));
  });
}

// ---------- Reset ----------

// Async: resolves to true when the server data is deleted, false on failure.
export function resetAllData() {
  cache.subjects = [];
  cache.attendance = [];
  cache.meta = { subjectCounter: 0, attendanceCounter: 0, lastExportedAt: cache.meta.lastExportedAt };
  return enqueue('reset', async () => {
    await deleteEverythingRemote();
    check(await supabase.from('app_meta').upsert(metaToRow(cache.meta), { onConflict: 'user_id' }));
  });
}

export function getLastExportedAt() {
  return cache.meta.lastExportedAt || null;
}

export function markExported() {
  saveMeta({ ...cache.meta, lastExportedAt: new Date().toISOString() });
}

// ---------- one-time migration from the old localStorage version ----------

export function isEmpty() {
  return cache.subjects.length === 0 && cache.attendance.length === 0;
}

// Returns data saved by the old (localStorage-only) version of the app in
// THIS browser, in backup format, or null if there is none.
export function getLegacyLocalData() {
  try {
    const subjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    if (!subjects.length && !attendance.length) return null;
    return { schemaVersion: SCHEMA_VERSION, subjects, attendance };
  } catch {
    return null;
  }
}

export function clearLegacyLocalData() {
  localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  localStorage.removeItem(STORAGE_KEYS.META);
}
