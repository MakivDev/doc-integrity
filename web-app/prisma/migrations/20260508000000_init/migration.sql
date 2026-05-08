-- CreateTable
CREATE TABLE "DocumentMetadata" (
    "hash" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentMetadata_pkey" PRIMARY KEY ("hash")
);
