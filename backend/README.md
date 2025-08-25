# PDS Backend (Express + Sequelize + PostgreSQL)

## Quick start

1. Copy environment variables:
   - Create a `.env` file from `.env.example` and update values if needed.

2. Install dependencies:
   - In the `server/` folder run `npm install`.

3. Start dev server:
   - `npm run dev` (defaults to http://localhost:4000)

4. Endpoints
   - `GET /health` — health check.
   - `POST /api/auth/register` — body: `{ name, email, password }` (bootstrap an admin or first user)
   - `POST /api/auth/login` — body: `{ email, password }` → `{ token, user }`
   - `GET /api/dashboard` — requires `Authorization: Bearer <token>`

## Notes
- Sequelize is configured in `src/models/index.js` and syncs on boot.
- Adjust CORS via `CORS_ORIGIN` if the frontend runs on a different URL.
- Use a proper secret for JWT in production.
