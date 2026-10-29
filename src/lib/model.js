import { addDays, daysBetween, isoToKey } from "./dates.js";

export const SCHEMA = 2;

let counter = 0;
export const makeId = () => {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
};

const area = (name, subs = []) => ({
  id: makeId(),
  name,
  subs: subs.map((s) => ({ id: makeId(), name: s })),
});

export const defaultAreas = () => [
  area("Studies", ["GATE", "College", "Projects"]),
  area("Food", ["Breakfast", "Lunch", "Dinner", "Snacks"]),
  area("Sleep"),
  area("Entertainment", ["Games", "Movies", "Series", "YouTube"]),
  area("Prayer", ["Fajr", "Zuhr", "Asr", "Maghrib", "Isha"]),
];

export const emptyData = () => ({ v: SCHEMA, habits: [], marks: {}, tasks: [], areas: defaultAreas() });

export function normalizeData(raw) {
  if (!raw || typeof raw !== "object" || raw.v !== SCHEMA) return emptyData();
  return {
    v: SCHEMA,
    habits: Array.isArray(raw.habits) ? raw.habits : [],
    marks: raw.marks && typeof raw.marks === "object" ? raw.marks : {},
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    areas: Array.isArray(raw.areas) ? raw.areas : defaultAreas(),
  };
}

/* ---------- non-negotiables (habits) ---------- */

export const newHabit = ({ name, startDate, time = null, areaId = null, subId = null }) => ({
  id: makeId(), name, startDate, endDate: null, time, areaId, subId,
});

export const habitActive = (h, k) => h.startDate <= k && (!h.endDate || h.endDate >= k);
export const habitsOn = (habits, k) => habits.filter((h) => habitActive(h, k));
export const isMarked = (marks, k, id) => Boolean(marks[k] && marks[k][id]);

export const doneOn = (data, k) =>
  habitsOn(data.habits, k).filter((h) => isMarked(data.marks, k, h.id)).length;

export const dayPct = (data, k) => {
  const total = habitsOn(data.habits, k).length;
  return total ? Math.round((doneOn(data, k) / total) * 100) : null;
};

export function toggleMark(marks, k, id, today) {
  const day = { ...(marks[k] || {}) };
  if (day[id]) delete day[id];
  else day[id] = k === today ? new Date().toISOString() : 1;
  const next = { ...marks };
  if (Object.keys(day).length) next[k] = day;
  else delete next[k];
  return next;
}

export function habitStats(data, habit, today) {
  const last = habit.endDate && habit.endDate < today ? habit.endDate : today;
  if (habit.startDate > last) return { current: 0, best: 0, done: 0, days: 0, rate: 0 };
  let best = 0, run = 0, done = 0, days = 0;
  for (let k = habit.startDate; k <= last; k = addDays(k, 1)) {
    days += 1;
    if (isMarked(data.marks, k, habit.id)) {
      done += 1; run += 1; best = Math.max(best, run);
    } else run = 0;
  }
  let current = 0;
  let k = last;
  if (k === today && !isMarked(data.marks, k, habit.id)) k = addDays(k, -1);
  while (k >= habit.startDate && isMarked(data.marks, k, habit.id)) {
    current += 1; k = addDays(k, -1);
  }
  return { current, best, done, days, rate: Math.round((done / days) * 100) };
}

export function perfectStreak(data, today) {
  const perfect = (d) => {
    const t = habitsOn(data.habits, d).length;
    return t > 0 && doneOn(data, d) === t;
  };
  let k = today;
  if (!perfect(k)) k = addDays(k, -1);
  let n = 0;
  while (n < 1000 && perfect(k)) { n += 1; k = addDays(k, -1); }
  return n;
}

/* ---------- negotiables (day-to-day tasks) ---------- */

export const newTask = ({ title, date, time = null, mins = 30, areaId = null, subId = null }) => ({
  id: makeId(), title, date, originalDate: date, done: false, doneAt: null,
  time, mins, areaId, subId, carried: 0, gcalId: null,
});

export function rollTasks(tasks, today) {
  let moved = 0;
  const next = tasks.map((t) => {
    if (t.done || t.date >= today) return t;
    moved += 1;
    return { ...t, date: today, carried: daysBetween(t.originalDate || t.date, today), gcalId: null };
  });
  return { tasks: moved ? next : tasks, moved };
}

export const taskDoneKey = (t) => (t.doneAt ? isoToKey(t.doneAt) : t.date);

/* ---------- life areas ---------- */

export function areaLabel(areas, areaId, subId) {
  const a = areas.find((x) => x.id === areaId);
  if (!a) return "";
  const s = subId ? a.subs.find((x) => x.id === subId) : null;
  return s ? `${a.name} (${s.name})` : a.name;
}

export function removeArea(data, id) {
  const clear = (x) => (x.areaId === id ? { ...x, areaId: null, subId: null } : x);
  return { ...data, areas: data.areas.filter((a) => a.id !== id), habits: data.habits.map(clear), tasks: data.tasks.map(clear) };
}

export function removeSub(data, areaId, subId) {
  const clear = (x) => (x.areaId === areaId && x.subId === subId ? { ...x, subId: null } : x);
  return {
    ...data,
    areas: data.areas.map((a) => (a.id === areaId ? { ...a, subs: a.subs.filter((s) => s.id !== subId) } : a)),
    habits: data.habits.map(clear),
    tasks: data.tasks.map(clear),
  };
}
