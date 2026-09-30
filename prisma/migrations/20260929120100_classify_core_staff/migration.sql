UPDATE "User" AS user_record
SET "role" = 'STAFF'::"UserRole"
FROM "StaffProfile" AS profile
WHERE profile."userId" = user_record."id"
  AND user_record."role" = 'RECEPTIONIST'
  AND profile."displayTitle" IN (
    'Human Resource',
    'Physiotherapist',
    'Accountant',
    'Sales',
    'Marketer',
    'Customer Service Rep',
    'Operations',
    'Cleaner',
    'Security',
    'Maintenance',
    'Spa-Attendant'
  );
