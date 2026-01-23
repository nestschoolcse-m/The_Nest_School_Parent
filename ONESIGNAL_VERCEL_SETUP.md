# OneSignal on Vercel – Fix "Can only be used on: http://localhost:3000"

The error happens because **OneSignal’s Site URL must exactly match the page origin**. The SDK checks this and throws when it doesn’t match.

## 1. OneSignal Dashboard – Site URL (required)

1. Open [OneSignal](https://dashboard.onesignal.com) → your app.
2. Go to **Settings** → **Push & In‑App** → **Web**.
3. Find **Site URL**.
4. Set it to your **exact production origin** (no path, no trailing slash), e.g.:
   - `https://your-app.vercel.app`
   - or `https://yourdomain.com` if you use a custom domain on Vercel.
5. Do **not** use `http://localhost:3000` here if you want production to work.
6. Save.

Important: OneSignal effectively allows **one Site URL per app**. For both localhost and Vercel you’d need either two OneSignal apps or to change this setting when switching.

---

## 2. Vercel – Environment variables

In the Vercel project: **Settings** → **Environment Variables**, add:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Your OneSignal App ID (same as in OneSignal) | Production, Preview |
| `NEXT_PUBLIC_ONESIGNAL_SITE_URL` | `https://your-app.vercel.app` (or your real production URL) | Production, Preview |

`NEXT_PUBLIC_ONESIGNAL_SITE_URL` is used so we only init OneSignal when the page origin matches. That avoids running the SDK on wrong origins (e.g. localhost when the app is configured for Vercel) and prevents the "Can only be used on: ..." and related `UserNamespace` / `tt` errors.

For **preview** deployments (e.g. `https://xyz-git-branch-*.vercel.app`): either add each preview URL you need in OneSignal (if they support multiple), or use a **second OneSignal app** whose Site URL is that preview origin.

---

## 3. Checklist

- [ ] **Site URL** in OneSignal = `https://<your-vercel-app>.vercel.app` (or your production domain).
- [ ] No trailing slash, no path, no `www` unless that’s the real URL.
- [ ] `NEXT_PUBLIC_ONESIGNAL_APP_ID` set in Vercel (and in `.env.local` for localhost if you use it).
- [ ] `NEXT_PUBLIC_ONESIGNAL_SITE_URL` set in Vercel to the same origin as Site URL.
- [ ] Redeploy on Vercel after changing env vars.
- [ ] Hard refresh or incognito when testing to avoid cached SDK/config.

---

## 4. Localhost vs production

- If **Site URL** is set to the Vercel URL:
  - Production (Vercel): works.
  - Localhost: with `NEXT_PUBLIC_ONESIGNAL_SITE_URL` set to the Vercel URL, we skip OneSignal on localhost (no SDK errors).
- If you want OneSignal on **localhost** as well: use a **separate OneSignal app** for dev, set its Site URL to `http://localhost:3000`, and use `NEXT_PUBLIC_ONESIGNAL_APP_ID` (and optionally `NEXT_PUBLIC_ONESIGNAL_SITE_URL`) in `.env.local` for that app.
