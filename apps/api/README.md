# Spa Elaris API

NestJS API boundary shared by the Next.js admin and the future Flutter app.

## Local commands

Run these commands from the repository root:

```bash
npm run api:typecheck
npm run api:build
```

The API uses the root Prisma schema and `DATABASE_URL`. Its health endpoint is
available at `/api/health` once the application is running.