import { practiceService } from '../services/practice.service.js';

export const practiceController = {
  async papers(_req, res, next) {
    try {
      res.json(await practiceService.listPapers());
    } catch (err) {
      next(err);
    }
  },

  async questions(req, res, next) {
    try {
      res.json(await practiceService.listQuestions(req.query));
    } catch (err) {
      next(err);
    }
  },

  async submit(req, res, next) {
    try {
      res.json(await practiceService.submit(req.body.answers));
    } catch (err) {
      next(err);
    }
  },
};
