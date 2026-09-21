// attendance.js — business logic for recording, correcting, and deleting
// attendance. UI code should call these functions rather than touching
// storage.js or validation.js directly for attendance operations.

import * as storage from './storage.js';
import { validateAttendance } from './validation.js';

export function listAttendanceForSubject(subjectId) {
  return storage
    .getAttendance()
    .filter((a) => a.subjectId === subjectId)
    .sort((a, b) => a.date.localeCompare(b.date)); // chronological
}

export function findExistingRecord(subjectId, date, excludeId = null) {
  return (
    storage
      .getAttendance()
      .find((a) => a.subjectId === subjectId && a.date === date && a.id !== excludeId) || null
  );
}

export function getAttendanceById(id) {
  return storage.getAttendance().find((a) => a.id === id) || null;
}

export function addAttendance({ subjectId, date, status, remarks }) {
  const records = storage.getAttendance();
  const result = validateAttendance({ subjectId, date, status }, records);
  if (!result.valid) return { success: false, errors: result.errors };

  const now = new Date().toISOString();
  const record = {
    id: storage.generateAttendanceId(),
    subjectId,
    date,
    status,
    remarks: (remarks || '').trim(),
    createdAt: now,
    updatedAt: now,
  };
  records.push(record);
  storage.saveAttendance(records);
  return { success: true, record };
}

export function updateAttendance(id, { date, status, remarks }) {
  const records = storage.getAttendance();
  const existing = records.find((r) => r.id === id);
  if (!existing) return { success: false, errors: ['Attendance record not found.'] };

  const result = validateAttendance({ subjectId: existing.subjectId, date, status }, records, id);
  if (!result.valid) return { success: false, errors: result.errors };

  const idx = records.findIndex((r) => r.id === id);
  records[idx] = {
    ...existing,
    date,
    status,
    remarks: (remarks || '').trim(),
    updatedAt: new Date().toISOString(),
  };
  storage.saveAttendance(records);
  return { success: true, record: records[idx] };
}

export function deleteAttendance(id) {
  const records = storage.getAttendance().filter((r) => r.id !== id);
  storage.saveAttendance(records);
  return { success: true };
}
