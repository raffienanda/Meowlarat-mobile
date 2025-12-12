/*
  Warnings:

  - Added the required column `address` to the `petplace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `petplace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `petplace` table without a default value. This is not possible if the table is not empty.

  - Added the required column `link` to the `tokoonline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama` to the `tokoonline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `tokoonline` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cat" ADD COLUMN     "isTaken" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "donasi" ADD COLUMN     "bukti_transfer" VARCHAR(255);

-- AlterTable
ALTER TABLE "metode" ADD COLUMN     "an" VARCHAR(255),
ADD COLUMN     "category" VARCHAR(255) NOT NULL DEFAULT 'Transfer Bank',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo" VARCHAR(255),
ADD COLUMN     "rek" VARCHAR(255);

-- AlterTable
ALTER TABLE "petplace" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "tokoonline" ADD COLUMN     "link" TEXT NOT NULL,
ADD COLUMN     "nama" VARCHAR(255) NOT NULL,
ADD COLUMN     "source" VARCHAR(50) NOT NULL,
ALTER COLUMN "notes" DROP NOT NULL;
