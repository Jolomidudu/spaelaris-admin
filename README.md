# Spaelaris Admin

Spaelaris Admin is the operations platform for a multi-location spa and massage business. It supports the daily work of owners, managers, receptionists, and therapists across the Spaelaris Lagos and Abuja locations.

The platform manages:

- Services, categories, pricing, and treatment duration
- Service packages and customer memberships
- Customers and booking history
- Therapists and their bookable services
- Treatment rooms by location
- Appointments and scheduling
- Payments, Paystack transactions, and payment status
- Dashboard metrics for appointments, revenue, customers, and rooms

## Architecture

This workspace contains the backend application. The admin frontend is maintained in the separate `sew-admin2` project.

- **API:** NestJS 11
- **Database:** PostgreSQL on Neon
- **ORM:** Prisma
- **Authentication:** JWT with bcrypt password validation
- **Payments:** Paystack with Nigerian naira pricing
- **Backend hosting:** Railway
- **Frontend:** Next.js 16 and React 19 in the frontend project

The API uses the `/api` prefix. The frontend communicates with the deployed Railway API through `NEXT_PUBLIC_API_URL`.

## Roles

Spaelaris supports these admin roles:

- **Owner:** Full business access
- **Manager:** Operational and staff management
- **Receptionist:** Customers, appointments, rooms, and payments
- **Therapist:** Assigned services and appointment work

## Core API Areas

Authenticated endpoints currently include:

- `/api/auth`
- `/api/services`
- `/api/packages`
- `/api/staff`
- `/api/customers`
- `/api/rooms`
- `/api/appointments`
- `/api/payments`

The health check is available at `/api/health`.

## Requirements

- Node.js 20 or later
- npm
- A Neon PostgreSQL database
- A Railway service for the API

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your-neon-pooled-connection-string"
JWT_SECRET="your-long-random-secret"
OWNER_INITIAL_PASSWORD="your-initial-owner-password"
PAYSTACK_SECRET_KEY="your-paystack-secret-key"
```

`PAYSTACK_SECRET_KEY` is required for Paystack checkout initialization and webhook verification. It can be omitted while working on non-payment features.

## Local Development

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run db:generate
```

Validate the Prisma schema:

```bash
npm run db:validate
```

Apply migrations to the configured database:

```bash
npm run db:migrate:deploy
```

Seed the initial Spaelaris owner, locations, services, categories, and rooms:

```bash
npm run db:seed
```

Build the API:

```bash
npm run api:build
```

Start the compiled API:

```bash
npm run api:start
```

The API listens on the Railway-provided `PORT`, or port `3001` locally when no port is configured.

## Railway Deployment

Railway should be connected to the `master` branch of the backend repository.

Use these service commands:

**Build command**

```bash
npm run railway:build
```

**Start command**

```bash
npm run api:start
```

The Railway build generates Prisma Client, applies production migrations, and compiles the NestJS API. Configure `DATABASE_URL`, `JWT_SECRET`, `OWNER_INITIAL_PASSWORD`, and `PAYSTACK_SECRET_KEY` in the Railway service variables.

After deployment, verify the service with:

```text
https://your-railway-domain/api/health
```

## Frontend Connection

In the separate `sew-admin2` frontend project, set:

```env
NEXT_PUBLIC_API_URL="https://your-railway-domain"
```

The frontend stores the authenticated session in the browser and sends the JWT as a bearer token to protected API routes.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the Next.js application |
| `npm run api:typecheck` | Type-check the NestJS API without emitting files |
| `npm run api:build` | Compile the NestJS API |
| `npm run api:start` | Start the compiled API |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:migrate` | Create and apply a development migration |
| `npm run db:migrate:deploy` | Apply existing migrations |
| `npm run db:seed` | Seed the Spaelaris database |
| `npm run railway:build` | Prepare the API for Railway deployment |

## Product Direction

The first release focuses on reliable spa operations:

1. Admin authentication and role-aware access
2. Service and package catalog management
3. Customer self-booking support
4. Receptionist-created appointments
5. Therapist and room scheduling
6. Paystack and offline payment tracking
7. Membership assignment and management

Email, SMS, WhatsApp, and push notifications are planned for a later release. Therapist mobile workflows will be delivered through the planned Flutter application.


