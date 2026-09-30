UPDATE "User" AS user_record
SET "role" = 'STAFF'::"UserRole",
    "passwordHash" = NULL
FROM "StaffProfile" AS profile
WHERE profile."userId" = user_record."id"
  AND profile."displayTitle" IN (
    'Cleaner',
    'Security',
    'Maintenance',
    'Spa-Attendant'
  );
