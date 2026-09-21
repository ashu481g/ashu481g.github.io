// validation.js
// Shared validation rules, used by both subjects.js and attendance.js so
// the rules exist in exactly one place.

import { STATUS_LIST } from './constants.js';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
  const d = new Date(value + 'T00:00:00');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

// Returns { valid: true } or { valid: false, errors: [...] }
export function validateSubject(input, existingSubjects, excludeId = null) {
  const errors = [];
  const name = (input.name || '').trim();
  const code = (input.code || '').trim();

  if (!name) errors.push('Subject name is required.');

  const duplicate = existingSubjects.some((s) => {
    if (s.id === excludeId) return false;
    const nameMatches = normalize(s.name) === normalize(name);
    const codeMatches = code && normalize(s.code) === normalize(code);
    return nameMatches || codeMatches;
  });
  if (duplicate) {
    errors.push('A subject with this name or code already exists.');
  }

  return { valid: errors.length === 0, errors };
}

// Returns { valid: true } or { valid: false, errors: [...] }
// excludeId lets an edit check duplicates against every OTHER record.
export function validateAttendance(input, existingRecords, excludeId = null) {
  const errors = [];

  if (!input.subjectId) errors.push('Subject is required.');
  if (!input.date || !isValidIsoDate(input.date)) errors.push('A valid date is required.');
  if (!input.status || !STATUS_LIST.includes(input.status)) errors.push('A valid status is required.');

  if (input.subjectId && input.date) {
    const duplicate = existingRecords.some(
      (r) => r.id !== excludeId && r.subjectId === input.subjectId && r.date === input.date
    );
    if (duplicate) {
      errors.push('DUPLICATE'); // sentinel — UI shows the special "edit existing?" dialog for this
    }
  }

  return { valid: errors.length === 0, errors };
}
