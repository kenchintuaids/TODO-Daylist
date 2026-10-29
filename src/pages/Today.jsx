import { useRef, useState } from "react";
import { Box, Pie, Seg, ConfirmBtn, AreaSelect } from "../components/ui.jsx";
import { addDays, durLabel, fmtTime, longDate, minToTime, shortDate, timeToMin } from "../lib/dates.js";
import { areaLabel, habitStats, habitsOn, isMarked, newHabit, newTask, toggleMark } from "../lib/model.js";
import { createEvent, deleteEvent, updateEvent } from "../lib/google.js";

const eventOf = (t) => ({ title: t.title, dateKey: t.date, start: t.time, end: minToTime(timeToMin(t.time) + (t.mins || 30)) });

function QuickAdd({ date, today, update }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState("negotiable");
  const submit = () => {
    const v = text.trim();
    if (!v) return;
    if (kind === "negotiable") update((d) => ({ ...d, tasks: [...d.tasks, newTask({ title: v, date })] }));
    else update((d) => ({ ...d, habits: [...d.habits, newHabit({ name: v, startDate: today })] }));
    setText("");
  };
  return (
    <div className="addbar">
      <input className="field" value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={kind === "negotiable" ? "Add a task for this day" : "Add a daily non-negotiable"} aria-label="New item" />
      <div className="row">
        <Seg value={kind} onChange={setKind} options={[{ value: "negotiable", label: "Negotiable" }, { value: "non", label: "Non-negotiable" }]} />
        <button className="btn ink" onClick={submit}>Add</button>
      </div>
      <div className="small faint">
        {kind === "negotiable"
          ? `One-off, for ${shortDate(date)}. If it isn't done, it carries over to the next day.`
          : "Repeats every day from today and shows up in the Habits notebook."}
      </div>
    </div>
  );
}

function TaskRow({ t, areas, patch, onToggle, onDelete, google, open, setOpen }) {
  const label = areaLabel(areas, t.areaId, t.subId);
  return (
    <>
      <div className={`item${t.done ? " done" : ""}${open ? " open" : ""}`}>
        <Box on={t.done} onClick={() => onToggle(t)} label={`Mark ${t.title} ${t.done ? "not done" : "done"}`} />
        <div className="t pick" onClick={() => setOpen(open ? null : t.id)}>{t.title}</div>
        {label && <span className="tag">{label}</span>}
        {t.time && <span className="tag ink">{fmtTime(t.time)}</span>}
        {t.carried > 0 && <span className="tag red">carried {t.carried}d</span>}
        {t.gcalId && <span className="tag ink">in Google Calendar</span>}
      </div>
      {open && (
        <div className="drawer">
          <div className="row">
            <label className="small muted">Time</label>
            <input type="time" className="field sm" style={{ width: "auto" }} value={t.time || ""}
              onChange={(e) => patch(t, { time: e.target.value || null })} />
            <select className="field sm" style={{ width: "auto" }} value={t.mins || 30} onChange={(e) => patch(t, { mins: Number(e.target.value) })} aria-label="Duration">
              {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{durLabel(m)}</option>)}
            </select>
          </div>
          <AreaSelect areas={areas} areaId={t.areaId} subId={t.subId} onChange={(a, s) => patch(t, { areaId: a, subId: s })} />
          <div className="row">
            {google.connected && t.time && !t.gcalId && (
              <button className="btn sm" onClick={() => google.add(t)}>Add to Google Calendar</button>
            )}
            {google.needsReconnect && <button className="btn sm" onClick={google.reconnect}>Reconnect Google</button>}
            <ConfirmBtn onConfirm={() => onDelete(t)}>Delete</ConfirmBtn>
          </div>
        </div>
      )}
    </>
  );
}

export default function Today({ data, update, today, date, setDate, google, goTab }) {
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState("");
  const syncTimers = useRef({});
  const habits = habitsOn(data.habits, date);
  const done = habits.filter((h) => isMarked(data.marks, date, h.id)).length;
  const tasks = data.tasks
    .filter((t) => t.date === date)
    .sort((a, b) => (a.done - b.done) || String(a.time || "99").localeCompare(String(b.time || "99")));
  const left = tasks.filter((t) => !t.done).length;
  const future = date > today;

  const run = (p) => p.catch((e) => setErr(e.message || "Google Calendar failed."));
  const patch = (t, changes) => {
    update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, ...changes } : x)) }));
    const next = { ...t, ...changes };
    if (!t.gcalId || !google.connected) return;
    if ("time" in changes && !changes.time) {
      run(google.call((tok) => deleteEvent(tok, t.gcalId)));
      update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, gcalId: null } : x)) }));
    } else if ("time" in changes || "mins" in changes) {
      // typing a time fires several changes in a row; send only the last one
      clearTimeout(syncTimers.current[t.id]);
      syncTimers.current[t.id] = setTimeout(() => run(google.call((tok) => updateEvent(tok, t.gcalId, eventOf(next)))), 700);
    }
  };
  const addToCalendar = (t) => run(
    google.call((tok) => createEvent(tok, eventOf(t))).then((id) =>
      update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, gcalId: id } : x)) })))
  );
  const toggleTask = (t) =>
    update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done, doneAt: x.done ? null : new Date().toISOString() } : x)) }));
  const removeTask = (t) => {
    if (t.gcalId && google.connected) run(google.call((tok) => deleteEvent(tok, t.gcalId)));
    update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== t.id) }));
  };

  return (
    <div>
      <div className="datenav">
        <button className="btn sm" onClick={() => setDate(addDays(date, -1), "prev")} aria-label="Previous day">&lt;</button>
        <div className="d">{longDate(date)}</div>
        <button className="btn sm" onClick={() => setDate(addDays(date, 1), "next")} aria-label="Next day">&gt;</button>
        {date !== today && <button className="btn link sm" onClick={() => setDate(today, date > today ? "prev" : "next")}>Back to today</button>}
      </div>

      <div className="today-top" style={{ marginTop: 18 }}>
        <Pie done={done} total={habits.length} />
        <div className="pie-text">
          {habits.length ? (<><b>{done} / {habits.length}</b>non-negotiables done</>) : (<><b>0</b>non-negotiables yet</>)}
          <div className="small muted">{left} negotiable {left === 1 ? "task" : "tasks"} left</div>
        </div>
      </div>

      <QuickAdd date={date} today={today} update={update} />
      {err && <p className="note err" onClick={() => setErr("")}>{err}</p>}

      <div className="h2">Non-negotiable</div>
      {habits.length === 0 && <div className="empty">Nothing here yet. Add a daily non-negotiable above.</div>}
      {habits.map((h) => {
        const st = habitStats(data, h, today);
        const label = areaLabel(data.areas, h.areaId, h.subId);
        return (
          <div key={h.id} className={`item${isMarked(data.marks, date, h.id) ? " done" : ""}`}>
            <Box on={isMarked(data.marks, date, h.id)} disabled={future} label={`Mark ${h.name}`}
              onClick={() => update((d) => ({ ...d, marks: toggleMark(d.marks, date, h.id, today) }))} />
            <div className="t">{h.name}</div>
            {label && <span className="tag">{label}</span>}
            {h.time && <span className="tag ink">{fmtTime(h.time)}</span>}
            {st.current > 1 && <span className="tag">{st.current} day streak</span>}
          </div>
        );
      })}
      {habits.length > 0 && <p><button className="btn link sm" onClick={() => goTab("habits")}>Open the habit notebook</button></p>}

      <div className="h2">Negotiable</div>
      {tasks.length === 0 && <div className="empty">No tasks for this day. Add one above.</div>}
      {tasks.map((t) => (
        <TaskRow key={t.id} t={t} areas={data.areas} patch={patch} onToggle={toggleTask} onDelete={removeTask}
          google={{ ...google, add: addToCalendar }} open={open === t.id} setOpen={setOpen} />
      ))}
    </div>
  );
}
