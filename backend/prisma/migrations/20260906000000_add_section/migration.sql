-- CreateEnum
CREATE TYPE "Section" AS ENUM ('mbbs', 'mdcat');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "section" "Section" NOT NULL DEFAULT 'mbbs';

-- AlterTable
ALTER TABLE "content_items" ADD COLUMN "section" "Section" NOT NULL DEFAULT 'mbbs';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "section" "Section" NOT NULL DEFAULT 'mbbs';

-- CreateIndex
CREATE INDEX "categories_section_parent_id_idx" ON "categories"("section", "parent_id");

-- CreateIndex
CREATE INDEX "content_items_section_category_id_idx" ON "content_items"("section", "category_id");

-- CreateIndex
CREATE INDEX "posts_section_category_id_idx" ON "posts"("section", "category_id");