CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

ALTER TABLE "Booking"
  ALTER COLUMN "status" TYPE "BookingStatus"
  USING ("status"::text::"BookingStatus");