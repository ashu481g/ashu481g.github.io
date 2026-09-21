// subjects.js — business logic for Subject Management.
// UI code should call these functions rather than touching storage.js or
// validation.js directly for subject operations.

import * as storage from './storage.js';
import { validateSubject } from './validation.js';

export function listSubjects() {
  // Alphabetical by name — stable, predictable ordering everywhere they're listed.
  return storage.getSubjects().slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getSubjectById(id) {
  return storage.getSubjects().find((s) => s.id === id) || null;
}

// Returns how many attendance records belong to a subject — used to decide
// whether the "this will also affect attendance records" warning is shown.
export function countAttendanceForSubject(subjectId) {
  return storage.getAttendance().filter((a) => a.subjectId === subjectId).length;
}

export function addSubject({ name, code, description }) {
  const subjects = storage.getSubjects();
  const result = validateSubject({ name, code }, subjects);
  if (!result.valid) return { success: false, errors: result.errors };

  const subject = {
    id: storage.generateSubjectId(),
    name: name.trim(),
    code: (code || '').trim(),
    description: (description || '').trim(),
    createdAt: new Date().toISOString(),
  };
  subjects.push(subject);
  storage.saveSubjects(subjects);
  return { success: true, subject };
}

export function updateSubject(id, { name, code, description }) {
  const subjects = storage.getSubjects();
  const result = validateSubject({ name, code }, subjects, id);
  if (!result.valid) return { success: false, errors: result.errors };

  const idx = subjects.findIndex((s) => s.id === id);
  if (idx === -1) return { success: false, errors: ['Subject not found.'] };

  subjects[idx] = {
    ...subjects[idx],
    name: name.trim(),
    code: (code || '').trim(),
    description: (description || '').trim(),
  };
  storage.saveSubjects(subjects);
  return { success: true, subject: subjects[idx] };
}

// cascade=true also removes every attendance record for this subject.
// The UI is responsible for confirming this with the user first.
export function deleteSubject(id, { cascade = true } = {}) {
  const subjects = storage.getSubjects().filter((s) => s.id !== id);
  storage.saveSubjects(subjects);

  if (cascade) {
    const attendance = storage.getAttendance().filter((a) => a.subjectId !== id);
    storage.saveAttendance(attendance);
  }
  return { success: true };
}
