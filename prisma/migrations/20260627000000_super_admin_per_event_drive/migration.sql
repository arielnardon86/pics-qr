-- AlterTable Admin: add isSuperAdmin, remove Google tokens (moved to Event)
ALTER TABLE "Admin" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Admin" DROP COLUMN IF EXISTS "googleAccessToken";
ALTER TABLE "Admin" DROP COLUMN IF EXISTS "googleRefreshToken";
ALTER TABLE "Admin" DROP COLUMN IF EXISTS "googleTokenExpiry";

-- AlterTable Event: add clientId and per-event Google tokens
ALTER TABLE "Event" ADD COLUMN "clientId" TEXT;
ALTER TABLE "Event" ADD COLUMN "googleAccessToken" TEXT;
ALTER TABLE "Event" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "Event" ADD COLUMN "googleTokenExpiry" TIMESTAMP(3);

-- AddForeignKey for clientId
ALTER TABLE "Event" ADD CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
