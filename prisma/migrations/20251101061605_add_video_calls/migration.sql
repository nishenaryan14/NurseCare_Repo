-- CreateEnum
CREATE TYPE "public"."CallStatus" AS ENUM ('ONGOING', 'ENDED', 'MISSED');

-- CreateTable
CREATE TABLE "public"."VideoCall" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "roomName" TEXT NOT NULL,
    "startedBy" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "public"."CallStatus" NOT NULL DEFAULT 'ONGOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoCall_roomName_key" ON "public"."VideoCall"("roomName");

-- AddForeignKey
ALTER TABLE "public"."VideoCall" ADD CONSTRAINT "VideoCall_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
