// validation.js
// Shared validation rules, used by both subjects.js and attendance.js so
// the rules exist in exactly one place.

import { STATUS_LIST } from './constants.js';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Validated entirely in UTC-space (Date.UTC / getUTC*) rather than via
// `new Date(value)` + toISOString(). That round-trip goes through the
// browser's LOCAL timezone, so in any timezone ahead of UTC (e.g. IST,
// UTC+5:30) local midnight rolls back a day once converted to UTC and a
// perfectly valid date like "2026-09-11" would be wrongly rejected.
// Building and reading the date in UTC throughout avoids that entirely.
export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
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
