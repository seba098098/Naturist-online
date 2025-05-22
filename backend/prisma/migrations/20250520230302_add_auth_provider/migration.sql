-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK', 'APPLE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL';
