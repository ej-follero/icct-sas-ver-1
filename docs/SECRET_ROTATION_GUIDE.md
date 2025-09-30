# Secret Rotation Guide

This guide covers safely rotating credentials used by the ICCT Smart Attendance System.

## 1) JWT Secret
- Update `.env`:
  - `JWT_SECRET=<new-random-48-bytes-base64>`
- Restart the app to invalidate existing tokens.
- Optional: bump `sessionVersion` for all users to force re-auth.

## 2) Gmail SMTP (or other SMTP)
- Generate a new App Password (Gmail → Security → App passwords).
- Update `.env`:
  - `SMTP_USER=<your-gmail>@gmail.com`
  - `SMTP_PASS=<new-16-char-app-password>`
- Do not commit real values; keep in secret manager in production.

## 3) Database (Postgres)
- Create a new DB user and password with least-privilege.
- Grant required permissions to the application database.
- Update `DATABASE_URL` in `.env`.
- Rotate old user password and remove when traffic is drained.

## 4) Docker Compose (local only)
- Change `POSTGRES_PASSWORD` to a new value in your local environment (not committed).
- Recreate the DB container if needed: `npm run db:reset`.

## 5) Where to store secrets
- Local development: `.env` only (in `.gitignore`).
- Production: use your cloud secret manager (e.g., AWS Secrets Manager, GCP Secret Manager, or GitHub Actions Encrypted Secrets for CI only).

## 6) Verification Checklist
- `npm run build` passes.
- Login works after JWT rotation (users re-authenticate).
- Email tests pass: `npm run test:email`.
- Database connections succeed with the new user.

## 7) Incident response (found secret exposure)
- Immediately rotate the exposed credential(s).
- Invalidate tokens (JWT rotation).
- Review access logs for misuse.
- Ensure CI secret scanning passed (Gitleaks) and pre-commit Secretlint is active.


