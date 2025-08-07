-- Remove SMS and BOTH from NotificationMethod enum
-- First, update any existing records that use SMS or BOTH to use EMAIL
UPDATE "AttendanceNotification" SET "method" = 'EMAIL' WHERE "method" IN ('SMS', 'BOTH');

-- Create a new enum with only EMAIL
CREATE TYPE "NotificationMethod_new" AS ENUM ('EMAIL');

-- Update the column to use the new enum type
ALTER TABLE "AttendanceNotification" 
ALTER COLUMN "method" TYPE "NotificationMethod_new" 
USING "method"::text::"NotificationMethod_new";

-- Drop the old enum
DROP TYPE "NotificationMethod";

-- Rename the new enum to the original name
ALTER TYPE "NotificationMethod_new" RENAME TO "NotificationMethod"; 