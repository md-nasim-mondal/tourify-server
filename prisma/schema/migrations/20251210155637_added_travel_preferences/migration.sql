-- AlterTable
ALTER TABLE "users" ADD COLUMN     "travelPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[];
