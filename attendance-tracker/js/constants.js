// constants.js
// Single source of truth for storage keys, schema version, and the status
// registry. Business rules elsewhere (reports.js, validation.js, ui.js)
// read from STATUSES rather than hardcoding "Present" / "Absent" so a new
// status can be added here without touching the rest of the app.

export const STORAGE_KEYS = {
  SUBJECTS: 'attendanceTracker.subjects',
  ATTENDANCE: 'attendanceTracker.attendance',
  META: 'attendanceTracker.meta',
};

// Bump this if the shape of the stored/exported data ever changes.
// storage.js uses it to refuse to import an incompatible backup file.
export const SCHEMA_VERSION = 1;

// Every attendance status the app understands.
//   label             - shown in menus, tables, and pills
//   countsTowardTotal - included in "Total Classes"
//   countsAsAttended  - included in the numerator of the attendance %
// To add "Late" or "Excused" later, add an entry here only.
export const STATUSES = {
  Present: { label: 'Present', countsTowardTotal: true, countsAsAttended: true },
  Absent: { label: 'Absent', countsTowardTotal: true, countsAsAttended: false },
};

export const STATUS_LIST = Object.keys(STATUSES);

export const DEFAULT_STATUS = 'Present';
