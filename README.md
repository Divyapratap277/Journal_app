# Trading Journal

Personal trading journal: record trades, attach screenshots, filter history, and view performance stats.

## Stack

- **Frontend:** React (Vite) on Vercel
- **Backend:** Node.js + Express on Vercel
- **Database:** PostgreSQL (Neon, or local Docker Postgres)
- **Images:** Cloudinary

## Local setup

### 1. Database

Either create a free [Neon](https://neon.tech) project, or run Postgres with Docker:

```bash
docker compose up -d
```

Local Docker URL:

```
postgresql://journal:journal@localhost:5432/trading_journal
```

### 2. Backend

```bash
cd backend
copy .env.example .env
```

Set in `.env`:

- `DATABASE_URL` and `DIRECT_URL` (same value for local Docker; Neon gives a pooled URL and a direct URL)
- `APP_PASSWORD` and `JWT_SECRET`
- Cloudinary `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `CORS_ORIGIN=http://localhost:5173`

```bash
npm install
npx prisma migrate deploy
npm run dev
```

After pulling schema updates (accounts, removed trade columns), run `npx prisma migrate deploy` again. Existing trades are assigned to **Main Account**. See [backend/MIGRATION.md](backend/MIGRATION.md).

API: http://localhost:4000

### 3. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

App: http://localhost:5173  
Password is `APP_PASSWORD` from the backend env.

## Deploy on Vercel

Create **two** projects from the same Git repo.

### Backend project

- Root directory: `backend`
- Environment variables: `DATABASE_URL`, `DIRECT_URL`, `APP_PASSWORD`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CORS_ORIGIN` (your frontend URL)
- Build command (already in `package.json` as `vercel-build`): `prisma generate && prisma migrate deploy`

Use Neon’s **pooled** connection string for `DATABASE_URL` (add `pgbouncer=true` if Neon shows it) and the **direct** connection string for `DIRECT_URL`.

### Frontend project

- Root directory: `frontend`
- Environment variable: `VITE_API_URL=https://<your-backend>.vercel.app`
- Redeploy the frontend after you set `VITE_API_URL` (Vite embeds it at build time)

Then set backend `CORS_ORIGIN` to the frontend URL and redeploy the backend.
