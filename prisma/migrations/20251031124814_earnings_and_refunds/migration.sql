-- AlterTable
ALTER TABLE "public"."NurseProfile" ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
