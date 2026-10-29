# Connecting Daybook to Google (sign-in + Calendar)

Daybook signs you in with your Google account and, optionally, reads and writes your Google
Calendar. It runs entirely in your browser: there is no server and no secret key. All you need is
a free **OAuth Client ID** from Google Cloud. About 5 minutes, once.

## 1. Create a project
1. Go to https://console.cloud.google.com and sign in with the Google account you will use.
2. Top bar: project picker, **New project**, name it `Daybook`, **Create**, then select it.

## 2. Turn on the Calendar API
1. Menu, **APIs & Services**, **Library**.
2. Search **Google Calendar API**, open it, **Enable**.

## 3. Set up the consent screen
1. Menu, **APIs & Services**, **OAuth consent screen** (newer console: **Google Auth Platform**).
2. Click **Get started** / **Configure**.
   - App name: `Daybook`. User support email: yours.
   - Audience / user type: **External**.
   - Contact email: yours. Accept the terms, **Create**.
3. **Audience** (or **Test users**), **Add users**: add every Gmail address that should be able to sign in
   (at least yours). While the app is in "Testing", only these accounts can sign in. That is fine for personal use.
4. **Data Access** (or **Scopes**), **Add or remove scopes**: add
   `https://www.googleapis.com/auth/calendar.events`. The basic ones (openid, email, profile) are already there. **Save**.

## 4. Create the Client ID
1. **APIs & Services**, **Credentials** (or **Google Auth Platform**, **Clients**), **Create credentials**, **OAuth client ID**.
2. Application type: **Web application**. Name: `Daybook web`.
3. **Authorized JavaScript origins**, add each address you will open the app from, exactly, no trailing slash:
   - `http://localhost:5173`
   - `https://YOUR-APP.vercel.app` (your real deployed address)
4. Leave **Authorized redirect URIs** empty (this sign-in method does not use one).
5. **Create**, then copy the **Client ID** (it ends in `.apps.googleusercontent.com`).
   You do not need the client secret. Do not put it anywhere.

## 5. Give the Client ID to the app
**On your computer:** in the project folder, create a file named `.env.local` containing one line:

```
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```

Then stop and restart `npm run dev` (Ctrl+C, then `npm run dev`). `.env.local` is ignored by git, so it won't be pushed.

**On Vercel:** Project, **Settings**, **Environment Variables**, add `VITE_GOOGLE_CLIENT_ID` with the same value
(all environments), then **Redeploy**. (The Client ID is public by design, it is not a password.)

## 6. First sign-in
Click **Continue with Google**. Because the app is in Testing mode you'll see "Google hasn't verified this app".
That is expected for your own app: **Advanced**, **Go to Daybook (unsafe)**. Leave the Calendar permission ticked.

## What you get
- **Sign-in:** your Google email is your account. Your notebook is stored in this browser under that email.
- **Plan page:** your Google Calendar events for the day appear as dashed blocks next to your own plan.
- **Today page:** open a task, give it a time, press **Add to Google Calendar**. Changing the time later updates the event;
  deleting the task deletes the event.

## Good to know
- Google access lasts about an hour. After that you'll see **Reconnect Google Calendar**. One click.
- Data does not sync between devices. It lives in each browser's storage. (Syncing would need a database; ask if you want that.)
- Sign-in only proves who you are to this page. It is not a server-side lock.

## If something goes wrong
| You see | Fix |
|---|---|
| `Error 400: origin_mismatch` | The address in your browser isn't listed under Authorized JavaScript origins. Add it exactly (http vs https, port, no trailing `/`). |
| `Error 403: access_denied` / "not completed the Google verification" | Add your email under Test users (step 3.3). |
| "Google Calendar refused the request" | The Calendar API isn't enabled in this project (step 2). |
| Sign-in button does nothing | Allow pop-ups for the site; check `.env.local` and restart `npm run dev`. |
| "Calendar access wasn't granted" in Setup | You unticked Calendar on the consent screen. Press **Allow calendar access** and tick it. |
