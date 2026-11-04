import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../lib/httpError.js';

export const bookService = {
  async listSubjects() {
    const subjects = await prisma.subject.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { books: { where: { isPublished: true } } } },
      },
    });

    return subjects.map(({ _count, ...subject }) => ({
      ...subject,
      bookCount: _count.books,
    }));
  },

  async listBooks({ subjectSlug }) {
    if (!subjectSlug) {
      return prisma.book.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'asc' },
        include: { subject: true },
      });
    }

    const subject = await prisma.subject.findUnique({ where: { slug: subjectSlug } });
    if (!subject) throw createHttpError(404, 'Subject not found');

    const books = await prisma.book.findMany({
      where: { subjectId: subject.id, isPublished: true },
      orderBy: { createdAt: 'asc' },
    });

    return { subject, books };
  },

  async getBook(id) {
    const book = await prisma.book.findFirst({ where: { id, isPublished: true } });
    if (!book) throw createHttpError(404, 'Book not found');
    return book;
  },
};
