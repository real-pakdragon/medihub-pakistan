import { bookService } from '../services/book.service.js';

export const bookController = {
  async subjects(_req, res, next) {
    try {
      res.json({ data: await bookService.listSubjects() });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const { subject } = req.query;
      const result = subject
        ? await bookService.listBooks({ subjectSlug: subject })
        : { books: await bookService.listBooks({}) };
      res.json({ data: result.books, subject: result.subject ?? undefined });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      res.json({ data: await bookService.getBook(req.params.id) });
    } catch (err) {
      next(err);
    }
  },
};
