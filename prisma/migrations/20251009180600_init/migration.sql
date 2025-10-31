/*
  Warnings:

  - You are about to drop the column `nurseProfileId` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `nurseId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Booking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_nurseProfileId_fkey";

-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "nurseProfileId",
ADD COLUMN     "nurseId" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."BookingStatus";

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
