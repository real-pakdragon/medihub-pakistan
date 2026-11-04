// One-off migration: lift legacy Subject + Book rows into the new
// CMS models (Category tree + ContentItem), preserving slugs, icons,
// visibility and file references.
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const subjects = await prisma.subject.findMany({ orderBy: { displayOrder: 'asc' } });
  if (subjects.length === 0) {
    console.log('No legacy subjects found, nothing to migrate.');
    return;
  }

  let categories = 0;
  for (const s of subjects) {
    await prisma.category.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        iconName: s.iconName,
        displayOrder: s.displayOrder,
      },
      create: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        iconName: s.iconName,
        displayOrder: s.displayOrder,
        isPublished: true,
      },
    });
    categories++;
  }

  const books = await prisma.book.findMany();
  let items = 0;
  for (const b of books) {
    const subject = subjects.find((s) => s.id === b.subjectId);
    if (!subject) continue;
    const category = await prisma.category.findUnique({ where: { slug: subject.slug } });
    if (!category) continue;
    await prisma.contentItem.create({
      data: {
        title: b.title,
        type: 'book',
        categoryId: category.id,
        author: b.author,
        edition: b.edition,
        description: b.description,
        fileName: b.fileName,
        filePath: b.filePath,
        isPublished: b.isPublished,
      },
    });
    items++;
  }

  console.log(`Done: ${categories} categories, ${items} content items created from legacy books.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());