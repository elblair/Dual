# Render: deploy the Dual web app (static site)

The web app is the Expo web export served as a **free Render static site**. It never sleeps (only the API does), redeploys from `main`, and talks to the API at `https://dual-api-memp.onrender.com`. Phones open the link and use **Add to Home Screen**: no Expo Go, no laptop.

Do this from the GitHub account that owns the repo (`elblair/Dual`), after the `release: v0.3.0` PR is merged into `main`. About 10 minutes. No secrets are involved: the only build settings are the public API URL and `EXPO_PUBLIC_USE_MOCK=false`.

## 1. Create the static site

### Option A: Blueprint (if the API was created from `render.yaml`)
1. Render dashboard > **Blueprints**. Open the Dual blueprint and click **Manual sync** (or it syncs by itself when `main` changes).
2. Render lists a new service **dual-web** (Static Site). Approve it. Render may ask for `CORS_ORIGINS` for `dual-api`: leave it as is for now (step 2 sets it).

### Option B: manual (works either way)
1. Dashboard > **New +** > **Static Site** > pick the `elblair/Dual` repo.
2. Fill in:

| Field | Value |
|---|---|
| Name | `dual-web` (any name; it becomes the URL) |
| Branch | `main` |
| Root Directory | `app` |
| Build Command | `npm ci && npx expo export --platform web` |
| Publish Directory | `dist` |

3. **Advanced** > **Add Environment Variable** (three of them):
   - `EXPO_PUBLIC_API_URL` = `https://dual-api-memp.onrender.com`
   - `EXPO_PUBLIC_USE_MOCK` = `false`
   - `NODE_VERSION` = `22.12.0`
4. Click **Create Static Site**. The first build takes a few minutes.
5. Site > **Redirects/Rewrites** > **Add Rule**: Source `/*`, Destination `/index.html`, Action **Rewrite**. This makes deep links and page reloads work (for example opening `/duel/12` directly).

When the build is green, copy the site URL (`https://<name>.onrender.com`). It is not a secret.

## 2. Restrict CORS on the API (do this once the URL is known)
Dashboard > **dual-api** > **Environment** > edit `CORS_ORIGINS` and set it to (replace `<name>` with the real site name, no trailing slash, no spaces):

```
https://<name>.onrender.com,http://localhost:8081,http://localhost:8099,http://127.0.0.1:8099
```

- The first one is the web app. The `localhost` ones are for developing with Expo web on a laptop.
- It must be the exact origin: `https://`, no path, no `/` at the end. A wrong value shows up as "Offline" / "Failed to fetch" in the web app (the API itself still works; phones running Expo Go are not affected because they do not send an origin).
- Save. Render restarts the API (about a minute). Never leave it at `*` once the site is live.

## 3. Check it
1. Open the site URL on a phone: the Welcome screen appears.
2. Register. Today shows the green **Live** badge with the API host.
3. Open `https://<name>.onrender.com/duel/1` directly (or reload on any screen): the app loads (it shows an error for a duel that is not yours, which is fine).
4. If you see **Offline**: check the `CORS_ORIGINS` value first, then that `EXPO_PUBLIC_API_URL` is set on the static site (changing it needs a redeploy: Site > **Manual Deploy** > **Clear build cache & deploy**).

## Good to know
- `EXPO_PUBLIC_*` values are baked into the build, so a changed value only takes effect after a new deploy.
- Every merge into `main` redeploys both services.
- The API still sleeps after about 15 minutes without traffic (first call about a minute). Open the site 5 minutes before the demo.
- Icons and home-screen settings live in `app/public/` (`manifest.json`, icons) and `app/app/+html.tsx`. `python design/make_icons.py` redraws the icons.
