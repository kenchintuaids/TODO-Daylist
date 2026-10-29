/* Google sign-in + Google Calendar, using Google Identity Services in the browser.
   No server and no client secret: you only need an OAuth "Web application" Client ID
   (see GOOGLE_SETUP.md). The access token lives in memory only and lasts about an hour. */

export const CLIENT_ID = (import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) || "";
export const googleConfigured = Boolean(CLIENT_ID);

const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const SCOPES = `openid email profile ${CAL_SCOPE}`;
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export class GoogleAuthError extends Error {}

let gisPromise = null;
function loadGis() {
  if (typeof window !== "undefined" && window.google && window.google.accounts && window.google.accounts.oauth2) {
    return Promise.resolve();
  }
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisPromise = null;
      reject(new Error("Could not load Google sign-in. Check your internet connection."));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

/* Opens Google's consent/sign-in popup. Must be called from a click handler. */
export async function requestToken({ hint } = {}) {
  if (!googleConfigured) throw new Error("Google sign-in is not set up yet.");
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      hint: hint || undefined,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        resolve({
          token: resp.access_token,
          expiresAt: Date.now() + ((Number(resp.expires_in) || 3600) - 60) * 1000,
          calendarOk: String(resp.scope || "").includes("calendar.events"),
        });
      },
      error_callback: (err) => {
        const type = err && err.type;
        reject(new Error(type === "popup_closed" ? "The Google window was closed before finishing." : type === "popup_failed_to_open" ? "Your browser blocked the Google window. Allow pop-ups for this site and try again." : (err && err.message) || "Google sign-in failed."));
      },
    });
    client.requestAccessToken();
  });
}

export async function fetchProfile(token) {
  const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Could not read your Google profile.");
  const p = await r.json();
  if (!p.email) throw new Error("Your Google account did not share an email address.");
  if (p.email_verified === false) throw new Error("That Google email address is not verified.");
  return { email: String(p.email).toLowerCase(), name: p.name || p.given_name || p.email, picture: p.picture || "" };
}

async function gfetch(token, url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (r.status === 401) throw new GoogleAuthError("Google session expired.");
  if (r.status === 403) throw new Error("Google Calendar refused the request. Is the Calendar API enabled for your project?");
  if (!r.ok) throw new Error(`Google Calendar error (${r.status}).`);
  return r.status === 204 ? null : r.json();
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export async function listEvents(token, dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const min = new Date(y, m - 1, d, 0, 0, 0);
  const max = new Date(y, m - 1, d + 1, 0, 0, 0);
  const q = `singleEvents=true&orderBy=startTime&maxResults=50&timeMin=${encodeURIComponent(min.toISOString())}&timeMax=${encodeURIComponent(max.toISOString())}`;
  const data = await gfetch(token, `${EVENTS_URL}?${q}`);
  return ((data && data.items) || [])
    .filter((e) => e.status !== "cancelled")
    .map((e) => {
      const allDay = Boolean(e.start && e.start.date && !e.start.dateTime);
      const start = e.start && e.start.dateTime ? new Date(e.start.dateTime) : null;
      const end = e.end && e.end.dateTime ? new Date(e.end.dateTime) : null;
      return {
        id: e.id,
        title: e.summary || "(no title)",
        allDay,
        startMin: start ? start.getHours() * 60 + start.getMinutes() : null,
        endMin: end ? end.getHours() * 60 + end.getMinutes() || 1440 : null,
        mine: Boolean(e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private.daybook),
      };
    });
}

const eventBody = ({ title, dateKey, start, end }) => ({
  summary: title,
  start: { dateTime: `${dateKey}T${start}:00`, timeZone: tz() },
  end: { dateTime: `${dateKey}T${end}:00`, timeZone: tz() },
  extendedProperties: { private: { daybook: "1" } },
});

export async function createEvent(token, ev) {
  const created = await gfetch(token, EVENTS_URL, { method: "POST", body: JSON.stringify(eventBody(ev)) });
  return created.id;
}

export async function updateEvent(token, id, ev) {
  await gfetch(token, `${EVENTS_URL}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(eventBody(ev)) });
}

export async function deleteEvent(token, id) {
  try {
    await gfetch(token, `${EVENTS_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (e) {
    if (e instanceof GoogleAuthError) throw e;
  }
}
