import { DEMO_AS_OF, DEMO_START, dateSequence } from './sampleData';
import type { DateRange, ISODate } from '../types';

export type Cadence = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
export type StudentActivity = {
  studentId: string;
  cohort: string;
  date: ISODate;
  activity: string;
  cadence: Cadence;
  completed: boolean;
  qualityScore: number | null;
  focusMinutes: number;
  outcomeScore: number | null;
};

// Synthetic student activity records for the assessment prototype. IDs and all values are invented.
const students = Array.from({ length: 24 }, (_, i) => ({
  id: `ST-${String(101 + i).padStart(3, '0')}`,
  cohort: `Cohort ${['A', 'B', 'C'][i % 3]}`,
  index: i + 1,
}));
const allDates = dateSequence(DEMO_START, DEMO_AS_OF);
const weekdayDates = allDates.filter((date) => new Date(`${date}T00:00:00Z`).getUTCDay() > 0 && new Date(`${date}T00:00:00Z`).getUTCDay() < 6);

export const studentActivities: StudentActivity[] = students.flatMap((student) => {
  const records: StudentActivity[] = [];
  const add = (date: ISODate, activity: string, cadence: Cadence, seed: number, focusMinutes = 0, outcomeScore: number | null = null) => {
    const completed = (student.index * 7 + seed * 11 + Number(date.slice(-2))) % 10 < (student.index % 4 === 0 ? 6 : 8);
    records.push({
      studentId: student.id,
      cohort: student.cohort,
      date,
      activity,
      cadence,
      completed,
      qualityScore: completed ? 3 + ((student.index + seed + Number(date.slice(-2))) % 3) : null,
      focusMinutes: completed ? focusMinutes : 0,
      outcomeScore: completed ? outcomeScore : null,
    });
  };

  weekdayDates.forEach((date, day) => {
    add(date, 'Focused study session', 'Daily', day, 25 + ((student.index * 3 + day * 7) % 36));
    add(date, 'Routine check-in', 'Daily', day + 3);
  });
  allDates.filter((date) => new Date(`${date}T00:00:00Z`).getUTCDay() === 5).forEach((date, week) => {
    add(date, 'Knowledge quiz', 'Weekly', week + 17, 0, 52 + ((student.index * 5 + week * 9) % 47));
    add(date, 'Mentor check-in', 'Weekly', week + 31);
  });
  allDates.filter((date) => ['08', '22'].includes(date.slice(-2))).forEach((date, monthSlot) => {
    add(date, 'Roadmap milestone review', 'Monthly', monthSlot + 53, 0, 45 + ((student.index * 7 + monthSlot * 13) % 56));
    if (monthSlot % 2 === 0) add(date, 'Workshop participation', 'Monthly', monthSlot + 71);
  });
  if (DEMO_START <= '2026-10-01' && DEMO_AS_OF >= '2026-10-01') {
    add('2026-10-01', 'Quarterly progress review', 'Quarterly', 97, 0, 48 + ((student.index * 11) % 53));
  }
  return records;
});

export type StudentRow = {
  studentId: string;
  cohort: string;
  planned: number;
  completed: number;
  completionPct: number;
  quality: number | null;
  focusMinutes: number;
  outcome: number | null;
};

export type ActivitySummary = {
  activity: string;
  cadence: Cadence;
  planned: number;
  completed: number;
  completionPct: number;
  quality: number | null;
};

export function studentAnalytics(range: DateRange, cohort = 'All cohorts', cadence: Cadence | 'All cadences' = 'All cadences') {
  const records = studentActivities.filter((item) => item.date >= range.start && item.date <= range.end && (cohort === 'All cohorts' || item.cohort === cohort) && (cadence === 'All cadences' || item.cadence === cadence));
  const ids = [...new Set(records.map((item) => item.studentId))];
  const rows: StudentRow[] = ids.map((studentId) => {
    const items = records.filter((item) => item.studentId === studentId);
    const completed = items.filter((item) => item.completed);
    const outcomes = completed.map((item) => item.outcomeScore).filter((value): value is number => value !== null);
    const qualities = completed.map((item) => item.qualityScore).filter((value): value is number => value !== null);
    return {
      studentId,
      cohort: items[0]?.cohort ?? '',
      planned: items.length,
      completed: completed.length,
      completionPct: items.length ? Math.round((completed.length / items.length) * 100) : 0,
      quality: qualities.length ? qualities.reduce((sum, value) => sum + value, 0) / qualities.length : null,
      focusMinutes: completed.reduce((sum, item) => sum + item.focusMinutes, 0),
      outcome: outcomes.length ? outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length : null,
    };
  });
  const completedRecords = records.filter((item) => item.completed);
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const qualityValues = completedRecords.map((item) => item.qualityScore).filter((value): value is number => value !== null);
  const outcomeValues = completedRecords.map((item) => item.outcomeScore).filter((value): value is number => value !== null);
  const activityMap = new Map<string, StudentActivity[]>();
  records.forEach((item) => {
    const key = `${item.activity}|${item.cadence}`;
    activityMap.set(key, [...(activityMap.get(key) ?? []), item]);
  });
  const activitySummaries: ActivitySummary[] = [...activityMap.entries()].map(([key, items]) => {
    const done = items.filter((item) => item.completed);
    const qualities = done.map((item) => item.qualityScore).filter((value): value is number => value !== null);
    return { activity: key.split('|')[0], cadence: items[0].cadence, planned: items.length, completed: done.length, completionPct: Math.round((done.length / items.length) * 100), quality: average(qualities) };
  }).sort((a, b) => ['Daily', 'Weekly', 'Monthly', 'Quarterly'].indexOf(a.cadence) - ['Daily', 'Weekly', 'Monthly', 'Quarterly'].indexOf(b.cadence) || a.activity.localeCompare(b.activity));
  const cohortSummaries = [...new Set(rows.map((row) => row.cohort))].map((name) => {
    const members = rows.filter((row) => row.cohort === name);
    return { cohort: name, completionPct: average(members.map((row) => row.completionPct)) ?? 0, outcome: average(members.map((row) => row.outcome).filter((value): value is number => value !== null)) ?? 0, students: members.length };
  });
  const weeks = [...new Set(records.map((item) => {
    const date = new Date(`${item.date}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  }))].sort();
  const weeklyTrend = weeks.map((weekStart) => {
    const weekRecords = records.filter((item) => {
      const date = new Date(`${item.date}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      return date.toISOString().slice(0, 10) === weekStart;
    });
    const done = weekRecords.filter((item) => item.completed);
    const qualityScores = done.map((item) => item.qualityScore).filter((value): value is number => value !== null);
    return { week: new Date(`${weekStart}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }), completionPct: weekRecords.length ? Math.round((done.length / weekRecords.length) * 100) : 0, quality: average(qualityScores) ?? 0 };
  });
  const riskStudents = rows.filter((row) => row.completionPct < 65 || (row.outcome !== null && row.outcome < 60)).length;
  return {
    records,
    rows: rows.sort((a, b) => a.studentId.localeCompare(b.studentId)),
    activeStudents: rows.filter((row) => row.completed > 0).length,
    activityCompletionPct: records.length ? Math.round((completedRecords.length / records.length) * 100) : 0,
    averageQuality: average(qualityValues),
    qualityResponsePct: completedRecords.length ? Math.round((qualityValues.length / completedRecords.length) * 100) : null,
    averageOutcome: average(outcomeValues),
    focusMinutes: completedRecords.reduce((sum, item) => sum + item.focusMinutes, 0),
    averageFocusMinutes: rows.length ? Math.round(completedRecords.reduce((sum, item) => sum + item.focusMinutes, 0) / rows.length) : 0,
    riskStudents,
    activitySummaries,
    cohortSummaries,
    weeklyTrend,
  };
}
