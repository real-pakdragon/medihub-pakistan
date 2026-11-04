ALTER TABLE "content_items" ALTER COLUMN "file_size" TYPE INTEGER USING ("file_size"::integer);
