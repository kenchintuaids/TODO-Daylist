export const pad = (n) => String(n).padStart(2, "0");

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const todayKey = () => toKey(new Date());
export const addDays = (k, n) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

export const monthOf = (k) => k.slice(0, 7);
export const shiftMonth = (ym, n) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const daysInMonth = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
export const monthLabel = (ym) =>
  parseKey(`${ym}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
export const longDate = (k) =>
  parseKey(k).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
export const shortDate = (k) =>
  parseKey(k).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export const WEEKDAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];

export const timeToMin = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const minToTime = (mins) => {
  const w = Math.max(0, Math.min(1439, Math.round(mins)));
  return `${pad(Math.floor(w / 60))}:${pad(w % 60)}`;
};
export const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};
export const fmtHour = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${h >= 12 ? "PM" : "AM"}`;
};
export const durLabel = (mins) => {
  const m = Math.round(mins || 0);
  const h = Math.floor(m / 60);
  if (h && m % 60) return `${h}h ${m % 60}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export const isoToKey = (iso) => toKey(new Date(iso));
export const isoToMin = (iso) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};
