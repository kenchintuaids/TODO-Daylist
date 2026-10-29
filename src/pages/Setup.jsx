import { useState } from "react";
import { Seg, ConfirmBtn } from "../components/ui.jsx";
import { emptyData, makeId, removeArea, removeSub } from "../lib/model.js";

function Areas({ data, update }) {
  const [name, setName] = useState("");
  const [subText, setSubText] = useState({});

  const addArea = () => {
    const v = name.trim();
    if (!v) return;
    update((d) => ({ ...d, areas: [...d.areas, { id: makeId(), name: v, subs: [] }] }));
    setName("");
  };
  const rename = (id, v) => update((d) => ({ ...d, areas: d.areas.map((a) => (a.id === id ? { ...a, name: v } : a)) }));
  const addSub = (id) => {
    const v = (subText[id] || "").trim();
    if (!v) return;
    update((d) => ({ ...d, areas: d.areas.map((a) => (a.id === id ? { ...a, subs: [...a.subs, { id: makeId(), name: v }] } : a)) }));
    setSubText((s) => ({ ...s, [id]: "" }));
  };

  return (
    <div>
      <p className="muted small" style={{ marginTop: 8 }}>
        Optional tags for sorting your tasks and habits by part of life. They don't change how anything is counted.
      </p>
      {data.areas.map((a) => (
        <div key={a.id} className="hrow">
          <div className="row">
            <input className="field grow" defaultValue={a.name} aria-label="Area name"
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== a.name) rename(a.id, v); else e.target.value = a.name; }} />
            <ConfirmBtn onConfirm={() => update((d) => removeArea(d, a.id))}>Delete</ConfirmBtn>
          </div>
          <div className="row">
            {a.subs.map((s) => (
              <span key={s.id} className="tag">{s.name}{" "}
                <button type="button" aria-label={`Remove ${s.name}`} style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
                  onClick={() => update((d) => removeSub(d, a.id, s.id))}>x</button>
              </span>
            ))}
            <input className="field sm" style={{ width: 150 }} placeholder="Add a subcategory" value={subText[a.id] || ""}
              onChange={(e) => setSubText((t) => ({ ...t, [a.id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addSub(a.id)} aria-label={`New subcategory for ${a.name}`} />
          </div>
        </div>
      ))}
      <div className="row" style={{ marginTop: 14 }}>
        <input className="field grow" placeholder="New area, e.g. Fitness" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addArea()} aria-label="New area" />
        <button className="btn ink" onClick={addArea}>Add area</button>
      </div>
    </div>
  );
}

export default function Setup({ data, update, session, google, theme, setTheme, onSignOut }) {
  return (
    <div>
      <div className="h2">You</div>
      <div className="row">
        <div className="grow">
          <div>{session.name}</div>
          <div className="small faint">{session.preview ? "Preview mode on this computer" : session.email}</div>
        </div>
        <button className="btn" onClick={onSignOut}>Sign out</button>
      </div>

      <div className="h2">Look</div>
      <Seg value={theme} onChange={setTheme} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />

      <div className="h2">Google Calendar</div>
      {session.preview ? (
        <div className="note">Preview mode. Sign in with Google to connect your calendar.</div>
      ) : google.connected ? (
        <p style={{ margin: "8px 0" }}>Connected as {session.email}. Your events show in the Planner, and any task with a time can be added to your calendar from the Today page.</p>
      ) : google.needsReconnect ? (
        <>
          <p style={{ margin: "8px 0" }}>Your Google session ended (they last about an hour). Reconnect to see and add events again.</p>
          <button className="btn ink" onClick={google.reconnect}>Reconnect Google</button>
        </>
      ) : (
        <>
          <p style={{ margin: "8px 0" }}>Calendar access wasn't granted when you signed in. Allow it to see events in the Planner and add tasks to your calendar.</p>
          <button className="btn ink" onClick={google.reconnect}>Allow calendar access</button>
        </>
      )}
      {google.error && <p className="note err">{google.error}</p>}

      <div className="h2">Life areas</div>
      <Areas data={data} update={update} />

      <div className="h2">Start over</div>
      <div className="row">
        <span className="grow muted small">Clears every habit, task and tick in this notebook and restores the default life areas.</span>
        <ConfirmBtn onConfirm={() => update(() => emptyData())} ask="Really erase?">Erase notebook</ConfirmBtn>
      </div>
    </div>
  );
}
