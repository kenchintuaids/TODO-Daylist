# Deploying Daybook (Vercel)

It's a static site: no server, nothing secret.

1. Push the project to GitHub.
2. On Vercel: **Add New, Project**, import the repo. Framework preset **Vite**, build `npm run build`, output `dist`.
3. Before the first real sign-in works, add the environment variable
   `VITE_GOOGLE_CLIENT_ID` (see GOOGLE_SETUP.md) under **Settings, Environment Variables**, then **Redeploy**.
4. Add your Vercel address (`https://YOUR-APP.vercel.app`) to **Authorized JavaScript origins** in Google Cloud
   (and any custom domain you attach later). Without this Google shows `origin_mismatch`.
5. Put the font files in `public/fonts/` before pushing if you want the real fonts online (see the README there).

In production there is no "Preview without Google" button; sign-in is Google only.
