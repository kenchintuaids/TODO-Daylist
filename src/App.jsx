import { useCallback, useEffect, useRef, useState } from "react";
import Login from "./Login.jsx";
import Today from "./pages/Today.jsx";
import Habits from "./pages/Habits.jsx";
import Planner from "./pages/Planner.jsx";
import Stats from "./pages/Stats.jsx";
import Setup from "./pages/Setup.jsx";
import { Rings } from "./components/ui.jsx";
import { doodleUrl } from "./lib/doodles.js";
import { drawFavicon } from "./lib/favicon.js";
import { installFonts } from "./lib/fonts.js";
import { GoogleAuthError, googleConfigured, requestToken } from "./lib/google.js";
import { monthOf, todayKey } from "./lib/dates.js";
import { doneOn, habitsOn, normalizeData, rollTasks } from "./lib/model.js";



const THEME_KEY = "daybook-theme";
const TABS = [["today", "Today"], ["habits", "Habits"], ["planner", "Plan"], ["stats", "Stats"], ["setup", "Setup"]];

function initialTheme() {
  try {
    const s = localStorage.getItem(THEME_KEY);
    if (s === "light" || s === "dark") return s;
  } catch { /* storage unavailable */ }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function Shell({ session, theme, onTheme, onSignOut }) {
  const key = `daybook-v2:${session.email}`;
  const [data, setData] = useState(null);
  const [today, setToday] = useState(todayKey);
  const [clock, setClock] = useState(() => Date.now());
  const [page, setPage] = useState("today");
  const [date, setDateState] = useState(todayKey);
  const [month, setMonthState] = useState(() => monthOf(todayKey()));
  const [turn, setTurn] = useState({ n: 0, dir: "next" });
  const [auth, setAuth] = useState({ token: session.token || null, expiresAt: session.expiresAt || 0, calendarOk: Boolean(session.calendarOk) });
  const [gerr, setGerr] = useState("");
  const todayRef = useRef(today);
  const pending = useRef(null);

  /* load this Google account's notebook, carrying unfinished tasks over to today */
  useEffect(() => {
    let off = false;
    (async () => {
      let raw = null;
      try {
        const r = await window.storage.get(key, false);
        raw = r && r.value ? JSON.parse(r.value) : null;
      } catch { /* first visit */ }
      if (off) return;
      const d = normalizeData(raw);
      setData({ ...d, tasks: rollTasks(d.tasks, todayKey()).tasks });
    })();
    return () => { off = true; };
  }, [key]);

  /* save a moment after every change, and flush when leaving */
  useEffect(() => {
    if (!data) return undefined;
    pending.current = JSON.stringify(data);
    const t = setTimeout(() => {
      if (pending.current) { window.storage.set(key, pending.current, false).catch(() => {}); pending.current = null; }
    }, 400);
    return () => clearTimeout(t);
  }, [data, key]);
  useEffect(() => {
    const flush = () => {
      if (pending.current) { window.storage.set(key, pending.current, false).catch(() => {}); pending.current = null; }
    };
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, [key]);

  /* clock: updates the "now" line and notices when midnight passes */
  useEffect(() => {
    const id = setInterval(() => {
      setClock(Date.now());
      const t = todayKey();
      if (t !== todayRef.current) {
        todayRef.current = t;
        setToday(t);
        setData((d) => (d ? { ...d, tasks: rollTasks(d.tasks, t).tasks } : d));
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  /* the red circle in the browser tab */
  useEffect(() => {
    if (!data) return;
    const total = habitsOn(data.habits, today).length;
    const done = doneOn(data, today);
    drawFavicon(done, total);
    document.title = total ? `Daybook ${done}/${total}` : "Daybook";
  }, [data, today]);

  const update = useCallback((fn) => setData((d) => fn(d)), []);

  const flip = (dir) => setTurn((t) => ({ n: t.n + 1, dir }));
  const go = (id) => {
    if (id === page) return;
    flip(TABS.findIndex((t) => t[0] === id) > TABS.findIndex((t) => t[0] === page) ? "next" : "prev");
    setPage(id);
  };
  const setDate = (k, dir) => { setDateState(k); flip(dir); };
  const setMonth = (ym, dir) => { setMonthState(ym); flip(dir); };

  /* Google Calendar plumbing */
  const tokenOk = Boolean(auth.token) && clock < auth.expiresAt;
  const call = useCallback(async (fn) => {
    try {
      return await fn(auth.token);
    } catch (e) {
      if (e instanceof GoogleAuthError) setAuth((a) => ({ ...a, expiresAt: 0 }));
      throw e;
    }
  }, [auth.token]);
  const reconnect = useCallback(async () => {
    setGerr("");
    try {
      const t = await requestToken({ hint: session.email });
      setAuth({ token: t.token, expiresAt: t.expiresAt, calendarOk: t.calendarOk });
    } catch (e) {
      setGerr(e.message);
    }
  }, [session.email]);
  const google = {
    connected: tokenOk && auth.calendarOk,
    needsReconnect: !session.preview && googleConfigured && !tokenOk,
    reconnect, call, error: gerr,
  };

  if (!data) return <div className="app"><div className="book"><div className="edge e1" /><div className="sheet"><p className="muted">Opening your notebook…</p></div></div></div>;

  const nowMin = new Date(clock).getHours() * 60 + new Date(clock).getMinutes();
  let content = null;
  if (page === "today") content = <Today data={data} update={update} today={today} date={date} setDate={setDate} google={google} goTab={go} />;
  else if (page === "habits") content = <Habits data={data} update={update} today={today} month={month} setMonth={setMonth} />;
  else if (page === "planner") content = <Planner data={data} update={update} today={today} date={date} setDate={setDate} nowMin={nowMin} google={google} />;
  else if (page === "stats") content = <Stats data={data} today={today} />;
  else content = <Setup data={data} update={update} session={session} google={google} theme={theme} setTheme={(t) => t !== theme && onTheme()} onSignOut={onSignOut} />;

  return (
    <div className="app">
      <div className="book">
        <div className="edge e2" /><div className="edge e1" />
        <Rings />
        <div className="sheet">
          <header className="head">
            <h1 className="brand">Daybook</h1>
            <div className="who">
              <span>{session.name}</span>
              <button className="btn sm" onClick={onTheme}>{theme === "dark" ? "Light" : "Dark"}</button>
              <button className="btn sm" onClick={onSignOut}>Sign out</button>
            </div>
          </header>
          <nav className="tabs" aria-label="Sections">
            {TABS.map(([id, label]) => (
              <button key={id} className="tab" aria-current={page === id ? "page" : undefined} onClick={() => go(id)}>{label}</button>
            ))}
          </nav>
          <div className="stage">
            <div key={`${page}:${turn.n}`} className={`turn${turn.dir === "prev" ? " prev" : ""}`}>{content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme);
  const [session, setSession] = useState(null);

  useEffect(() => { installFonts(); }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--doodle", doodleUrl(theme));
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);
  useEffect(() => {
    if (!session) { drawFavicon(0, 0); document.title = "Daybook"; }
  }, [session]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return session
    ? <Shell key={session.email} session={session} theme={theme} onTheme={toggle} onSignOut={() => setSession(null)} />
    : <Login onSession={setSession} theme={theme} onTheme={toggle} />;
}
