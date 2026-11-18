# Sign-up codes by email (Brevo)

New accounts get a 6-digit code by email and type it on the Verify screen. Codes last 10 minutes, allow 5 tries, can be
resent every 30 seconds, and only a hash is stored (`api/app/verification.py`). Accounts that existed before this
feature count as verified. Sign-up is email only for now (SMS codes cost money).

We use Brevo's free plan (300 emails a day, any recipient, no domain needed) through its HTTP API, because Render's free
plan blocks SMTP.

## Set up (once, about 5 minutes)
1. Create a free account at brevo.com.
2. Senders, Domains & Dedicated IPs > Senders > Add a sender: use an address the team can read (a shared Gmail is fine)
   and click the confirmation link Brevo emails to it.
3. SMTP & API > API keys > Generate a new API key. Copy it straight into the places below; never paste it into chat or
   commit it.
4. Render > `dual-api` > Environment: add `BREVO_API_KEY` (the key) and `EMAIL_FROM` (the sender from step 2). Save;
   Render redeploys.
5. Locally (optional): the same two lines in `api/.env`. Without them the API still works and prints each code in the
   uvicorn log, which is the easiest way to test.

## Notes
- Gmail may put the first emails in Spam until people mark one "Not spam".
- If sending fails, sign-up still creates the account; the Verify screen's "Send a new code" tries again.
