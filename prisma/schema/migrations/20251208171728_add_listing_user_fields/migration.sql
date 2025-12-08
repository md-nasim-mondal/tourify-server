-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "category" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxGroupSize" INTEGER,
ADD COLUMN     "meetingPoint" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dailyRate" DOUBLE PRECISION,
ADD COLUMN     "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[];
