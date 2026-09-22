// reports.js — all attendance-percentage and summary math lives here.
// No other module computes a percentage or a total; they call into this
// one so there is exactly one implementation to get right (and extend
// when a new status like "Late" or "Excused" is added to constants.js).

import * as storage from './storage.js';
import { listSubjects } from './subjects.js';
import { listAttendanceForSubject } from './attendance.js';
import { STATUSES } from './constants.js';

// Computes { total, present, absent, percentage } for one subject.
// "present"/"absent" are reported for the two current statuses, but the
// underlying total/percentage math is generic over STATUSES so a future
// status is handled automatically once it's added to constants.js.
export function computeSubjectStats(subjectId) {
  const records = listAttendanceForSubject(subjectId);

  let total = 0;
  let attended = 0;
  let present = 0;
  let absent = 0;

  for (const record of records) {
    const config = STATUSES[record.status];
    if (!config) continue; // ignore unknown/legacy statuses defensively
    if (config.countsTowardTotal) total += 1;
    if (config.countsAsAttended) attended += 1;
    if (record.status === 'Present') present += 1;
    if (record.status === 'Absent') absent += 1;
  }

  const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

  return { total, present, absent, percentage, records };
}

// Overall summary across every subject, for the Dashboard.
export function computeOverallSummary() {
  const subjects = listSubjects();
  const attendance = storage.getAttendance();

  let total = 0;
  let attended = 0;
  let present = 0;
  let absent = 0;

  for (const record of attendance) {
    const config = STATUSES[record.status];
    if (!config) continue;
    if (config.countsTowardTotal) total += 1;
    if (config.countsAsAttended) attended += 1;
    if (record.status === 'Present') present += 1;
    if (record.status === 'Absent') absent += 1;
  }

  const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

  return { subjectCount: subjects.length, total, present, absent, percentage };
}

// One row per subject, for the Dashboard's subject-wise table.
export function computeSubjectWiseSummary() {
  return listSubjects().map((subject) => {
    const stats = computeSubjectStats(subject.id);
    return {
      subjectId: subject.id,
      name: subject.name,
      code: subject.code,
      total: stats.total,
      present: stats.present,
      absent: stats.absent,
      percentage: stats.percentage,
    };
  });
}
