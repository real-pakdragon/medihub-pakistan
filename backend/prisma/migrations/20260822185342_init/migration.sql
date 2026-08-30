-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('pre_clinical', 'clinical', 'past_papers', 'video', 'community', 'textbook');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('new', 'read', 'replied');

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "year_tag" TEXT,
    "icon_name" TEXT,
    "description" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmation_token" TEXT NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mdcat_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "launch_date" TIMESTAMP(3) NOT NULL,
    "current_phase" TEXT NOT NULL DEFAULT 'Registration',
    "phase_description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "mdcat_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resources_category_idx" ON "resources"("category");

-- CreateIndex
CREATE INDEX "resources_is_published_created_at_idx" ON "resources"("is_published", "created_at");

-- CreateIndex
CREATE INDEX "contact_messages_status_created_at_idx" ON "contact_messages"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_confirmation_token_key" ON "subscribers"("confirmation_token");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
