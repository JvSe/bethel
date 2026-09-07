DELETE FROM "member" AS a
USING "member" AS b
WHERE a.id > b.id
  AND a."organizationId" = b."organizationId"
  AND a."userId" = b."userId";

CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");
