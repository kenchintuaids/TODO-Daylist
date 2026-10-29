import { useState } from "react";
import { googleConfigured, requestToken, fetchProfile } from "./lib/google.js";
import { Rings } from "./components/ui.jsx";

const LAST_KEY = "daybook-last-user";
const readLast = () => {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || "null"); } catch { return null; }
};

export default function Login({ onSession, theme, onTheme }) {
  const last = readLast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const t = await requestToken({ hint: last && last.email });
      const profile = await fetchProfile(t.token);
      try { localStorage.setItem(LAST_KEY, JSON.stringify({ email: profile.email, name: profile.name })); } catch { /* private mode */ }
      onSession({ ...profile, token: t.token, expiresAt: t.expiresAt, calendarOk: t.calendarOk });
    } catch (e) {
      setError(e.message || "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <div className="book">
        <div className="edge e2" /><div className="edge e1" />
        <Rings />
        <div className="sheet">
          <div className="login">
            <h1 className="brand">Daybook</h1>
            <p className="muted">A notebook for the things you can't skip and the things you can.</p>

            {googleConfigured ? (
              <>
                <p><button className="btn ink" onClick={signIn} disabled={busy}>
                  {busy ? "Waiting for Google…" : last ? `Continue as ${last.name}` : "Continue with Google"}
                </button></p>
                {last && <p className="small faint">{last.email}</p>}
                <p className="small faint">Only Google sign-in is available. Your notebook is saved in this browser, under your Google email.</p>
              </>
            ) : (
              <>
                <div className="note" style={{ textAlign: "left" }}>
                  Google sign-in isn't set up yet. It takes about five minutes:
                  <ol>
                    <li>Create an OAuth Client ID in Google Cloud (steps are in <code>GOOGLE_SETUP.md</code>).</li>
                    <li>Put it in a file named <code>.env.local</code> as <code>VITE_GOOGLE_CLIENT_ID=your-id</code>.</li>
                    <li>Restart <code>npm run dev</code>.</li>
                  </ol>
                </div>
                {import.meta.env.DEV && (
                  <p><button className="btn" onClick={() => onSession({ email: "preview@local", name: "Preview", preview: true })}>
                    Preview without Google (this computer only)
                  </button></p>
                )}
              </>
            )}
            {error && <p className="note err">{error}</p>}
            <p><button className="btn link" onClick={onTheme}>{theme === "dark" ? "Switch to light" : "Switch to dark"}</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}
