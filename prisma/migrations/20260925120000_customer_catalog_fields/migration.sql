ALTER TABLE "StaffProfile"
  ADD COLUMN "publicSlug" TEXT,
  ADD COLUMN "displayTitle" TEXT,
  ADD COLUMN "rating" DOUBLE PRECISION,
  ADD COLUMN "reviewCount" INTEGER,
  ADD COLUMN "completedAppointments" INTEGER,
  ADD COLUMN "clientsServed" INTEGER,
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isPubliclyListed" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "StaffProfile_publicSlug_key" ON "StaffProfile"("publicSlug");

ALTER TABLE "ServiceCategory"
  ADD COLUMN "number" TEXT,
  ADD COLUMN "shortName" TEXT,
  ADD COLUMN "imageUrl" TEXT;

ALTER TABLE "Service"
  ADD COLUMN "details" TEXT,
  ADD COLUMN "benefits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "includes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "durationMinutes" DROP NOT NULL;