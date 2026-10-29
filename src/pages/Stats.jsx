import { addDays, shortDate } from "../lib/dates.js";
import { areaLabel, dayPct, habitStats, perfectStreak, taskDoneKey } from "../lib/model.js";

const W = 600;

function LineChart({ values, labels }) {
  const H = 200, L = 34, R = 10, T = 12, B = 28;
  const n = values.length;
  const x = (i) => L + (n > 1 ? (i * (W - L - R)) / (n - 1) : 0);
  const y = (v) => T + (1 - v / 100) * (H - T - B);
  const segs = [];
  let cur = [];
  values.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(v)]); });
  if (cur.length) segs.push(cur);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Share of non-negotiables done each day">
      {[0, 50, 100].map((v) => (<g key={v}><line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} /><text x={L - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>))}
      <line className="axis" x1={L} x2={L} y1={T} y2={H - B} />
      <line className="axis" x1={L} x2={W - R} y1={H - B} y2={H - B} />
      {labels.map((l, i) => (i % 5 === 0 || i === n - 1) && <text key={i} x={x(i)} y={H - 8} textAnchor={i === n - 1 ? "end" : "middle"}>{l}</text>)}
      {segs.map((s, i) => <polyline key={i} className="ln" points={s.map((p) => p.join(",")).join(" ")} />)}
      {segs.flat().map((p, i) => <circle key={i} className="dot" cx={p[0]} cy={p[1]} r="3.4" />)}
    </svg>
  );
}

function Bars({ values, labels }) {
  const H = 170, L = 30, R = 8, T = 10, B = 28;
  const max = Math.max(1, ...values);
  const n = values.length;
  const bw = (W - L - R) / n;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Negotiable tasks finished each day">
      <defs>
        <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" strokeWidth="2" />
        </pattern>
      </defs>
      <line className="axis" x1={L} x2={W - R} y1={H - B} y2={H - B} />
      <text x={L - 6} y={T + 6} textAnchor="end">{max}</text>
      <text x={L - 6} y={H - B} textAnchor="end">0</text>
      {values.map((v, i) => {
        const h = (v / max) * (H - T - B);
        return (
          <g key={i}>
            <rect x={L + i * bw + 4} y={H - B - h} width={bw - 8} height={h} fill="url(#hatch)" stroke="var(--ink)" strokeWidth="1.5" />
            {(i % 2 === 0 || n < 8) && <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function Stats({ data, today }) {
  const days30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const pct = days30.map((k) => dayPct(data, k));
  const days14 = days30.slice(-14);
  const tasksPerDay = days14.map((k) => data.tasks.filter((t) => t.done && taskDoneKey(t) === k).length);
  const active = data.habits.filter((h) => !h.endDate || h.endDate >= today);
  const streak = perfectStreak(data, today);

  // what got done in the last 30 days, grouped by life area
  const counts = {};
  const bump = (areaId, subId) => {
    const key = areaLabel(data.areas, areaId, subId) || "No area";
    counts[key] = (counts[key] || 0) + 1;
  };
  data.tasks.forEach((t) => { if (t.done && days30.includes(taskDoneKey(t))) bump(t.areaId, t.subId); });
  days30.forEach((k) => {
    const day = data.marks[k] || {};
    Object.keys(day).forEach((id) => { const h = data.habits.find((x) => x.id === id); if (h) bump(h.areaId, h.subId); });
  });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = rows.length ? rows[0][1] : 1;
  const hasAny = pct.some((p) => p != null) || tasksPerDay.some((v) => v > 0);

  if (!hasAny && !active.length) {
    return <div className="empty">Nothing to chart yet. Add a few non-negotiables, tick some days, and come back.</div>;
  }
  return (
    <div>
      <div className="row" style={{ gap: 28, marginTop: 4 }}>
        <div><div className="faint small">Perfect-day streak</div><div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>{streak}</div></div>
        <div><div className="faint small">Non-negotiables</div><div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>{active.length}</div></div>
        <div><div className="faint small">Tasks done (14 days)</div><div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>{tasksPerDay.reduce((a, b) => a + b, 0)}</div></div>
      </div>

      <div className="h2">Non-negotiables done, last 30 days (%)</div>
      <LineChart values={pct} labels={days30.map((k) => shortDate(k))} />

      <div className="h2">Negotiable tasks finished, last 14 days</div>
      <Bars values={tasksPerDay} labels={days14.map((k) => k.slice(8))} />

      <div className="h2">Each non-negotiable</div>
      {active.length === 0 && <div className="empty">No non-negotiables yet.</div>}
      {active.map((h) => {
        const s = habitStats(data, h, today);
        return (
          <div key={h.id} className="item">
            <div className="t">{h.name}</div>
            <span className="tag">{s.current} day streak</span>
            <span className="tag">best {s.best}</span>
            <span className="tag ink">{s.rate}%</span>
          </div>
        );
      })}

      <div className="h2">By life area, last 30 days</div>
      {rows.length === 0 && <div className="empty">Tag tasks and habits with a life area to see this fill in.</div>}
      {rows.map(([name, n]) => (
        <div key={name} className="item">
          <div className="t" style={{ flex: "0 0 38%" }}>{name}</div>
          <div className="hatchbar grow"><i style={{ width: `${(n / top) * 100}%` }} /></div>
          <span className="small muted" style={{ width: 28, textAlign: "right" }}>{n}</span>
        </div>
      ))}
    </div>
  );
}
