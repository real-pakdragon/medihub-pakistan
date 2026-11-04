// Bulk import books into the database.
//
// Reads a JSON file (default: prisma/import-books.json) with this shape:
// [
//   {
//     "subject": "physiology",            // subject slug (must already exist)
//     "title": "Guyton & Hall, Medical Physiology",
//     "author": "John E. Hall",
//     "edition": "14th Edition (2021)",
//     "description": "Optional short description",
//     "filePath": "/files/books/physiology/foo.pdf"   // OR a full external URL e.g. https://drive.google.com/...
//   }
// ]
//
// Run: node prisma/importBooks.js [path-to-json]
import { readFile } from 'node:fs/promises';
import { prisma } from '../src/lib/prisma.js';

const filePath = process.argv[2] ?? new URL('./import-books.json', import.meta.url).pathname;

function dump(book) {
  const subject = book.subject ? `[${book.subject}] ` : '';
  return `${subject}${book.title ?? '(untitled)'}`;
}

async function main() {
  const raw = await readFile(filePath, 'utf8');
  const books = JSON.parse(raw);
  if (!Array.isArray(books)) throw new Error('Expected a JSON array of books');

  let created = 0;
  let skipped = 0;

  for (const book of books) {
    if (!book.subject || !book.title || !book.filePath) {
      console.warn(`  SKIP (missing field) → ${dump(book)}`);
      skipped++;
      continue;
    }
    const subject = await prisma.subject.findUnique({ where: { slug: book.subject } });
    if (!subject) {
      console.warn(`  SKIP (unknown subject "${book.subject}") → ${dump(book)}`);
      skipped++;
      continue;
    }

    const existing = await prisma.book.findFirst({ where: { filePath: book.filePath } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.book.create({
      data: {
        title: book.title,
        subjectId: subject.id,
        author: book.author ?? null,
        edition: book.edition ?? null,
        description: book.description ?? null,
        fileName: book.fileName ?? book.title.replace(/[^\w\-. ]+/g, '').trim().replace(/\s+/g, '-') + '.pdf',
        filePath: book.filePath,
        isPublished: true,
      },
    });
    created++;
    console.log(`  + ${dump(book)}`);
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
