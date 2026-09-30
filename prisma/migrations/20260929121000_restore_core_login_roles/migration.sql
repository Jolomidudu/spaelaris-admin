UPDATE "User" AS user_record
SET "role" = 'RECEPTIONIST'::"UserRole"
FROM "StaffProfile" AS profile
WHERE profile."userId" = user_record."id"
  AND user_record."role" = 'STAFF'
  AND profile."displayTitle" IN (
    'Human Resource',
    'Physiotherapist',
    'Accountant',
    'Sales',
    'Marketer',
    'Customer Service Rep',
    'Operations'
  );
