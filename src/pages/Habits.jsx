import { useState } from "react";
import { ConfirmBtn, AreaSelect } from "../components/ui.jsx";
import { WEEKDAY_LETTER, addDays, daysInMonth, durLabel, monthLabel, pad, parseKey, shiftMonth } from "../lib/dates.js";
import { dayPct, habitActive, habitStats, isMarked, newHabit, toggleMark } from "../lib/model.js";

const ROW = 28;
const HEAD = 108;

/* The line drawn beside the grid: one dot per day, further right = more of that day's habits done. */
function Trend({ data, days, today }) {
  const W = 104;
  const H = HEAD + ROW * days.length;
  const x = (p) => 10 + (p / 100) * (W - 20);
  const pts = days.map((k, i) => {
    const p = k <= today ? dayPct(data, k) : null;
    return p == null ? null : { x: x(p), y: HEAD + i * ROW + ROW / 2 };
  });
  const segments = [];
  let cur = [];
  pts.forEach((p) => { if (p) cur.push(p); else { if (cur.length) segments.push(cur); cur = []; } });
  if (cur.length) segments.push(cur);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Share of habits done each day">
      <text x={W / 2} y={HEAD - 30} textAnchor="middle">done</text>
      <text x={x(0)} y={HEAD - 8} textAnchor="middle">0</text>
      <text x={x(50)} y={HEAD - 8} textAnchor="middle">50</text>
      <text x={x(100)} y={HEAD - 8} textAnchor="middle">100</text>
      <rect x="1" y={HEAD} width={W - 2} height={ROW * days.length} fill="none" className="axis" rx="4" />
      {[0, 50, 100].map((p) => <line key={p} className="grid" x1={x(p)} x2={x(p)} y1={HEAD} y2={H - 0} strokeDasharray="2 4" />)}
      {days.map((k, i) => <line key={k} className="grid" x1="1" x2={W - 1} y1={HEAD + i * ROW} y2={HEAD + i * ROW} />)}
      {segments.map((s, i) => <polyline key={i} className="ln" points={s.map((p) => `${p.x},${p.y}`).join(" ")} />)}
      {pts.map((p, i) => p && <circle key={i} className="dot" cx={p.x} cy={p.y} r="3.6" />)}
    </svg>
  );
}

function HabitEditor({ h, data, update, today }) {
  const st = habitStats(data, h, today);
  const patch = (changes) => update((d) => ({ ...d, habits: d.habits.map((x) => (x.id === h.id ? { ...x, ...changes } : x)) }));
  const stop = () => update((d) => {
    const yesterday = addDays(today, -1);
    if (h.startDate > yesterday) {
      const marks = { ...d.marks };
      Object.keys(marks).forEach((k) => {
        if (marks[k][h.id]) { const day = { ...marks[k] }; delete day[h.id]; if (Object.keys(day).length) marks[k] = day; else delete marks[k]; }
      });
      return { ...d, habits: d.habits.filter((x) => x.id !== h.id), marks };
    }
    return { ...d, habits: d.habits.map((x) => (x.id === h.id ? { ...x, endDate: yesterday } : x)) };
  });
  return (
    <div className="hrow">
      <div className="row">
        <input className="field grow" style={{ minWidth: 150 }} defaultValue={h.name} aria-label="Habit name"
          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== h.name) patch({ name: v }); else e.target.value = h.name; }} />
        <span className="tag">{st.current} day streak</span>
        <span className="tag">best {st.best}</span>
        <span className="tag">{st.rate}% overall</span>
      </div>
      <div className="row">
        <label className="small muted">Usual time</label>
        <input type="time" className="field sm" style={{ width: "auto" }} value={h.time || ""} onChange={(e) => patch({ time: e.target.value || null })} />
        <select className="field sm" style={{ width: "auto" }} value={h.mins || 30} onChange={(e) => patch({ mins: Number(e.target.value) })} aria-label="Duration">
          {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{durLabel(m)}</option>)}
        </select>
        <AreaSelect areas={data.areas} areaId={h.areaId} subId={h.subId} onChange={(a, s) => patch({ areaId: a, subId: s })} />
        <ConfirmBtn onConfirm={stop} ask="Stop tracking?">Stop tracking</ConfirmBtn>
      </div>
    </div>
  );
}

export default function Habits({ data, update, today, month, setMonth }) {
  const [text, setText] = useState("");
  const n = daysInMonth(month);
  const days = Array.from({ length: n }, (_, i) => `${month}-${pad(i + 1)}`);
  const shown = data.habits.filter((h) => h.startDate <= days[n - 1] && (!h.endDate || h.endDate >= days[0]));
  const current = data.habits.filter((h) => !h.endDate || h.endDate >= today);

  const add = () => {
    const v = text.trim();
    if (!v) return;
    update((d) => ({ ...d, habits: [...d.habits, newHabit({ name: v, startDate: today })] }));
    setText("");
  };
  const toggle = (k, id) => update((d) => ({ ...d, marks: toggleMark(d.marks, k, id, today) }));

  return (
    <div>
      <div className="datenav">
        <button className="btn sm" onClick={() => setMonth(shiftMonth(month, -1), "prev")} aria-label="Previous month">&lt;</button>
        <div className="d">{monthLabel(month)}</div>
        <button className="btn sm" onClick={() => setMonth(shiftMonth(month, 1), "next")} aria-label="Next month">&gt;</button>
      </div>
      <p className="muted small" style={{ margin: "10px 0 16px" }}>
        Non-negotiables. Tick a day when it's done. Scribbled in means done, blank means missed.
      </p>

      {shown.length === 0 ? (
        <div className="empty">No habits in this month yet. Add the first one below.</div>
      ) : (
        <div className="hgwrap">
          <div className="hgscroll">
            <div className="hg" style={{ "--n": shown.length }}>
              <div className="hg-top" />
              {shown.map((h) => <div key={h.id} className="hg-top" title={h.name}><span className="hg-name">{h.name}</span></div>)}
              {days.map((k) => {
                const wd = parseKey(k).getDay();
                return [
                  <div key={`d${k}`} className={`hg-day${wd === 0 || wd === 6 ? " wk" : ""}${k === today ? " today" : ""}`}>
                    <b>{WEEKDAY_LETTER[wd]}</b>{Number(k.slice(8))}
                  </div>,
                  ...shown.map((h) => {
                    const active = habitActive(h, k);
                    const on = isMarked(data.marks, k, h.id);
                    return (
                      <button key={`${k}${h.id}`} type="button" className={`hg-cell${on ? " on" : ""}`}
                        disabled={!active || k > today} aria-pressed={on}
                        aria-label={`${h.name} on ${k}`} onClick={() => toggle(k, h.id)} />
                    );
                  }),
                ];
              })}
              <div className="hg-foot">%</div>
              {shown.map((h) => {
                const last = days.filter((k) => habitActive(h, k) && k <= today);
                const d = last.filter((k) => isMarked(data.marks, k, h.id)).length;
                return <div key={h.id} className="hg-foot">{last.length ? Math.round((d / last.length) * 100) : "-"}</div>;
              })}
            </div>
          </div>
          <div className="trend"><Trend data={data} days={days} today={today} /></div>
        </div>
      )}

      <div className="h2">Add a non-negotiable</div>
      <div className="row">
        <input className="field grow" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="e.g. Gym, Fajr, GATE practice" aria-label="New habit" />
        <button className="btn ink" onClick={add}>Add</button>
      </div>

      {current.length > 0 && <div className="h2">Manage</div>}
      {current.map((h) => <HabitEditor key={h.id} h={h} data={data} update={update} today={today} />)}
    </div>
  );
}
