/*
  Warnings:

  - You are about to drop the column `nurseId` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `nurseProfileId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_nurseId_fkey";

-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "nurseId",
ADD COLUMN     "nurseProfileId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_nurseProfileId_fkey" FOREIGN KEY ("nurseProfileId") REFERENCES "public"."NurseProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
