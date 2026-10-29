# Daybook

A paper-and-pen notebook for your day.

- **Non-negotiable**: daily habits you can't skip. Tracked in a monthly notebook grid (tick a day, it scribbles in blue).
  The red circle in the browser tab fills as you finish them: half done is a half circle, all done is a full circle.
- **Negotiable**: the one-off tasks you add day to day. Unfinished ones carry over to the next day.
- **Plan** page: Plan vs Actual timelines. Your Google Calendar events show up beside them.
- **Stats**: line chart and bars, streaks, and a breakdown by life area (Studies, Food, Prayer, whatever you set up).
- Google sign-in only, light and dark paper themes, page-turn animation.

## Run it

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

Without a Google Client ID the login screen shows a setup note and, in `npm run dev` only, a
"Preview without Google" button so you can try everything locally. To enable real sign-in and Google Calendar,
follow **GOOGLE_SETUP.md**.

## Build / deploy

```bash
npm run build      # outputs dist/
npm run preview    # try the production build locally
```

See **DEPLOY.md** (Vercel). Fonts: see `public/fonts/README.txt`.

## Where things are

```
src/App.jsx          app shell, saving, page turns, tab icon, Google plumbing
src/Login.jsx        Google-only login
src/pages/           Today, Habits (notebook grid), Planner, Stats, Setup
src/lib/model.js     habits, tasks, streaks, carry-over
src/lib/google.js    Google sign-in + Calendar (browser only, no secrets)
src/lib/doodles.js   the wallpaper doodles
src/index.css        the paper/ink theme
```

Your notebook is saved in the browser (localStorage) under your Google email, so it doesn't sync between devices.
