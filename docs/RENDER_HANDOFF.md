# Render hand-off: deploy the Dual API

> **Live:** the API is deployed at **https://dual-api-memp.onrender.com** (Oregon, free tier, deploys from `main`). Check `https://dual-api-memp.onrender.com/health`. The steps below are how it was set up, kept for redeploying or recreating it.

For the teammate who owns the GitHub repo (`elblair/Dual`, private). About 10 minutes. You only need a free Render account and the Neon connection string.

**Why you:** Render can only see repos that the connected GitHub account owns, so the service has to be created from the owner's account. You enter the secrets yourself; they never go through chat.

## What you need first
- The `main` branch has the API (`api/`) and `render.yaml`. (Release v0.1.0 is merged; the Blueprint arrives with the next release PR from `develop`. Until then use the manual settings below.)
- The Neon connection string: Neon dashboard > the project > **Connect** > copy the `postgresql://...?sslmode=require` string. Ask the teammate who set up Neon if you do not have access.

## Option A: Blueprint (once `render.yaml` is on `main`)
1. Sign in at render.com with GitHub (the account that owns `Dual`).
2. **New +** > **Blueprint** > choose the `Dual` repo > **Connect**.
3. Render shows the `dual-api` service. When asked for `DATABASE_URL`, paste the Neon string. Everything else is pre-filled (region Oregon, free plan, build and start commands, `JWT_SECRET` generated, `CORS_ORIGINS=*`, `PYTHON_VERSION=3.12.7`).
4. **Apply**. Wait for the first build (a few minutes).

## Option B: manual (works today)
1. **New +** > **Web Service** > the `Dual` repo.
2. Settings:

| Field | Value |
|---|---|
| Name | `dual-api` |
| Region | **Oregon (US West)** |
| Branch | `main` |
| Root Directory | `api` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | **Free** |
| Health Check Path | `/health` |

3. Environment variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string |
| `JWT_SECRET` | a long random string (for example the output of `python -c "import secrets; print(secrets.token_urlsafe(48))"`) |
| `CORS_ORIGINS` | `*` |
| `PYTHON_VERSION` | `3.12.7` |

4. **Create Web Service**.

## Check it
Open `https://<service-name>.onrender.com/health`. It should show `{"status":"ok"}`. If the build fails, copy the last lines of the Render log (no secrets in it) and send them over.

## Send back
Only the service URL (`https://<service-name>.onrender.com`). It is not a secret.

## Good to know
- Free services sleep after about 15 minutes without traffic; the first request after that takes about a minute. Open `/health` a few minutes before the demo.
- Do not use Render Postgres (it expires after 30 days). The database stays on Neon.
- Render redeploys automatically when `main` changes.
