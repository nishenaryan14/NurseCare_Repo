/*
  Warnings:

  - The `status` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "status",
ADD COLUMN     "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING';
