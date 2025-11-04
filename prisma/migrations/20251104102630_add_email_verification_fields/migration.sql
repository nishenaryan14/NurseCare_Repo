-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "public"."User" ADD COLUMN "emailVerificationExpiry" TIMESTAMP(3);
