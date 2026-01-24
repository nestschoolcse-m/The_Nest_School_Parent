# OneSignal on Vercel – Fix "Can only be used on: http://localhost:3000"

The error happens because **OneSignal’s Site URL must exactly match the page origin**. The SDK checks this and throws when it doesn’t match.

---

## Stop errors immediately (optional)

To stop the errors while you fix the dashboard, on **Vercel** add:

- `NEXT_PUBLIC_ONESIGNAL_ENABLED` = `false`

Redeploy. OneSignal will not run; the rest of the app (including Firestore-based in-app updates) still works. Remove it or set to `true` after the steps below.

---

## 1. OneSignal Dashboard – Site URL (required)

1. Open [OneSignal](https://dashboard.onesignal.com) → select the app with ID `13657fb4-80b6-43d6-8f74-0a8bf3d4729d` (or your `NEXT_PUBLIC_ONESIGNAL_APP_ID`).
2. Go to **Settings** (gear) → **Platforms** → **Web Push** (or **Push & In-App** → **Web**).
3. Find **Site URL** (sometimes **Chrome Web Origin** in the API; in the UI it’s “Site URL”).
4. Set it to your **exact production origin** (no path, no trailing slash), e.g.:
   - `https://your-app.vercel.app`
   - or `https://yourdomain.com` if you use a custom domain on Vercel.
5. **Remove** `http://localhost:3000` here if you want production to work.
6. **Save** (and wait for the dashboard to finish saving).

OneSignal allows **one Site URL per app**. For localhost and Vercel you need either two OneSignal apps or to change this when switching.

---

## 2. Vercel – Environment variables

In the Vercel project: **Settings** → **Environment Variables**, add:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Your OneSignal App ID | Production, Preview |
| `NEXT_PUBLIC_ONESIGNAL_SITE_URL` | `https://your-app.vercel.app` (exact origin; same as OneSignal Site URL) | Production, Preview |

On production we **only** init OneSignal when `NEXT_PUBLIC_ONESIGNAL_SITE_URL` is set and matches `window.location.origin`. If it’s missing or different, we skip (no init, no "Can only be used on" or `UserNamespace` / `tt` errors).

For **preview** URLs (e.g. `https://xyz-git-branch-*.vercel.app`): use a **separate OneSignal app** with that origin as Site URL, or omit `NEXT_PUBLIC_ONESIGNAL_SITE_URL` for previews so we skip OneSignal there.

---

## 3. Clear cache and Service Workers (important)

OneSignal’s docs: **Service Worker ~24h cache**, **Web SDK ~3-day cache**. After changing the Site URL:

1. Open your Vercel site → DevTools (F12) → **Application** (Chrome) or **Storage** (Firefox).
2. **Service Workers**: unregister all (e.g. `OneSignalSDKWorker`, `OneSignalSDKUpdaterWorker`).
3. **Clear site data** / **Clear storage** for this origin (or use an incognito window).
4. **Hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) or close all tabs for that site and reopen.

If you don’t do this, the old “localhost” config can keep causing "Can only be used on: http://localhost:3000" for up to a few days.

---

## 4. Checklist

- [ ] **OneSignal** → Settings → Platforms → Web → **Site URL** = `https://<your-vercel-app>.vercel.app` (exact; no trailing slash or path).
- [ ] **Vercel** → `NEXT_PUBLIC_ONESIGNAL_APP_ID` and `NEXT_PUBLIC_ONESIGNAL_SITE_URL` (= same URL as above) for Production (and Preview if needed).
- [ ] Redeploy on Vercel after changing env vars.
- [ ] Unregister Service Workers and hard refresh (or incognito) when testing.

---

## 5. Localhost vs production

- **Site URL** set to the Vercel URL in OneSignal:
  - **Vercel**: works if `NEXT_PUBLIC_ONESIGNAL_SITE_URL` is set and matches.
  - **Localhost**: we skip OneSignal if `NEXT_PUBLIC_ONESIGNAL_SITE_URL` is the Vercel URL (no errors). For OneSignal on localhost, use a **second OneSignal app** with Site URL `http://localhost:3000` and its App ID in `.env.local` as `NEXT_PUBLIC_ONESIGNAL_APP_ID`.
