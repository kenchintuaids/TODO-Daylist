import { useEffect, useRef, useState } from "react";
import { Seg } from "../components/ui.jsx";
import { addDays, fmtHour, fmtTime, isoToKey, isoToMin, longDate, minToTime, timeToMin } from "../lib/dates.js";
import { habitsOn } from "../lib/model.js";
import { listEvents } from "../lib/google.js";

const PPM = 1.1; // pixels per minute
const LABEL = 48;

function packLanes(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const lanes = [];
  const laneOf = {};
  sorted.forEach((it) => {
    let i = lanes.findIndex((end) => end <= it.start);
    if (i === -1) { i = lanes.length; lanes.push(it.end); } else lanes[i] = it.end;
    laneOf[it.key] = i;
  });
  return { laneOf, count: Math.max(1, lanes.length) };
}

function Timeline({ items, lo, hi, showNow, nowMin, innerRef, onScroll }) {
  const { laneOf, count } = packLanes(items);
  const height = (hi - lo) * PPM;
  const hours = [];
  for (let m = Math.ceil(lo / 60) * 60; m <= hi; m += 60) hours.push(m);
  return (
    <div className="tl" ref={innerRef} onScroll={onScroll}>
      <div className="tl-inner" style={{ height }}>
        {hours.map((m) => <div key={m} className="tl-hour" style={{ top: (m - lo) * PPM }}><span>{fmtHour(m)}</span></div>)}
        {showNow && nowMin >= lo && nowMin <= hi && <div className="now" style={{ top: (nowMin - lo) * PPM }} />}
        {items.map((it) => {
          const h = Math.max(24, (it.end - it.start) * PPM - 2);
          const w = `((100% - ${LABEL + 8}px) / ${count})`;
          return (
            <div key={it.key} className={`blk ${it.kind}${it.done ? " done" : ""}`}
              style={{ top: (it.start - lo) * PPM + 1, height: h, left: `calc(${LABEL}px + ${w} * ${laneOf[it.key]})`, width: `calc(${w} - 4px)` }}
              title={`${it.title} ${fmtTime(minToTime(it.start))} to ${fmtTime(minToTime(it.end))}`}>
              <b>{it.title}</b>
              {h > 38 && <i>{fmtTime(minToTime(it.start))} to {fmtTime(minToTime(it.end))}</i>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Planner({ data, update, today, date, setDate, nowMin, google }) {
  const [view, setView] = useState("plan");
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");
  const [reload, setReload] = useState(0);
  const planRef = useRef(null);
  const actRef = useRef(null);

  const { connected, call } = google;
  useEffect(() => {
    if (!connected) return undefined;
    let cancelled = false;
    call((tok) => listEvents(tok, date))
      .then((ev) => { if (!cancelled) { setEvents(ev); setErr(""); } })
      .catch((e) => { if (!cancelled) setErr(e.message); });
    return () => { cancelled = true; };
  }, [connected, call, date, reload]);

  const habits = habitsOn(data.habits, date);
  const dayTasks = data.tasks.filter((t) => t.date === date);
  const mine = new Set(data.tasks.map((t) => t.gcalId).filter(Boolean));
  const shownEvents = connected ? events : [];

  const plan = [
    ...dayTasks.filter((t) => t.time).map((t) => ({ key: `t${t.id}`, kind: "task", title: t.title, start: timeToMin(t.time), end: timeToMin(t.time) + (t.mins || 30), done: t.done })),
    ...habits.filter((h) => h.time).map((h) => ({ key: `h${h.id}`, kind: "habit", title: h.name, start: timeToMin(h.time), end: timeToMin(h.time) + (h.mins || 30), done: Boolean(data.marks[date] && data.marks[date][h.id]) })),
    ...shownEvents.filter((e) => !e.allDay && e.startMin != null && !mine.has(e.id) && !e.mine)
      .map((e) => ({ key: `e${e.id}`, kind: "event", title: e.title, start: e.startMin, end: Math.max(e.endMin || e.startMin + 30, e.startMin + 15), done: false })),
  ];
  const allDay = shownEvents.filter((e) => e.allDay);

  const actual = [];
  data.tasks.forEach((t) => {
    if (t.done && t.doneAt && isoToKey(t.doneAt) === date) {
      const end = isoToMin(t.doneAt);
      actual.push({ key: `t${t.id}`, kind: "task", title: t.title, start: Math.max(0, end - (t.mins || 30)), end: Math.max(end, 15), done: false });
    }
  });
  habits.forEach((h) => {
    const v = data.marks[date] && data.marks[date][h.id];
    if (typeof v === "string") {
      const end = isoToMin(v);
      actual.push({ key: `h${h.id}`, kind: "habit", title: h.name, start: Math.max(0, end - (h.mins || 30)), end: Math.max(end, 15), done: false });
    }
  });

  const mins = [...plan, ...actual].flatMap((i) => [i.start, i.end]);
  let lo = Math.min(6 * 60, mins.length ? Math.floor((Math.min(...mins) - 30) / 60) * 60 : 6 * 60);
  let hi = Math.max(22 * 60, mins.length ? Math.ceil((Math.max(...mins) + 30) / 60) * 60 : 22 * 60);
  lo = Math.max(0, lo);
  hi = Math.min(1440, hi);

  useEffect(() => {
    const focus = date === today ? nowMin : 8 * 60;
    const top = Math.max(0, (focus - lo - 60) * PPM);
    if (planRef.current) planRef.current.scrollTop = top;
    if (actRef.current) actRef.current.scrollTop = top;
    // only when the day (or its visible range) changes, not every minute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, lo]);

  const toPlace = dayTasks.filter((t) => !t.time && !t.done);
  const setTime = (t, time) => update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, time: time || null } : x)) }));

  return (
    <div>
      <div className="datenav">
        <button className="btn sm" onClick={() => setDate(addDays(date, -1), "prev")} aria-label="Previous day">&lt;</button>
        <div className="d">{longDate(date)}</div>
        <button className="btn sm" onClick={() => setDate(addDays(date, 1), "next")} aria-label="Next day">&gt;</button>
        {date !== today && <button className="btn link sm" onClick={() => setDate(today, date > today ? "prev" : "next")}>Back to today</button>}
      </div>
      <p className="muted small" style={{ margin: "10px 0 0" }}>
        Plan is what you set for the day. Actual fills itself in when you tick things off.
      </p>

      <div className="row" style={{ marginTop: 10 }}>
        {connected && <><span className="tag ink">Google Calendar connected</span><button className="btn link sm" onClick={() => setReload((n) => n + 1)}>Refresh</button></>}
        {google.needsReconnect && <button className="btn sm" onClick={google.reconnect}>Reconnect Google Calendar</button>}
        {!connected && !google.needsReconnect && <span className="small faint">Connect Google Calendar in Setup to see your events here.</span>}
      </div>
      {err && <p className="note err">{err}</p>}
      {allDay.length > 0 && <p className="small muted" style={{ margin: "8px 0 0" }}>All day: {allDay.map((e) => e.title).join(", ")}</p>}

      <div className="pl-switch"><Seg value={view} onChange={setView} options={[{ value: "plan", label: "Plan" }, { value: "actual", label: "Actual" }]} /></div>
      <div className="pl-cols" data-view={view}>
        <div className="col-plan">
          <div className="pl-title">Plan <span>what I meant to do</span></div>
          <Timeline items={plan} lo={lo} hi={hi} showNow={date === today} nowMin={nowMin} innerRef={planRef}
            onScroll={(e) => { if (actRef.current) actRef.current.scrollTop = e.currentTarget.scrollTop; }} />
        </div>
        <div className="col-actual">
          <div className="pl-title">Actual <span>how it really went</span></div>
          <Timeline items={actual} lo={lo} hi={hi} showNow={date === today} nowMin={nowMin} innerRef={actRef}
            onScroll={(e) => { if (planRef.current) planRef.current.scrollTop = e.currentTarget.scrollTop; }} />
        </div>
      </div>

      <div className="row small muted" style={{ marginTop: 10, gap: 16 }}>
        <span><span className="tag ink">solid blue</span> negotiable</span>
        <span><span className="tag">hatched</span> non-negotiable</span>
        <span><span className="tag">dashed</span> Google Calendar</span>
      </div>

      <div className="h2">To place</div>
      {toPlace.length === 0 && <div className="empty">Every open task for this day has a time.</div>}
      {toPlace.map((t) => (
        <div key={t.id} className="item">
          <div className="t">{t.title}</div>
          <input type="time" className="field sm" style={{ width: "auto" }} value="" aria-label={`Set a time for ${t.title}`}
            onChange={(e) => setTime(t, e.target.value)} />
        </div>
      ))}
    </div>
  );
}
