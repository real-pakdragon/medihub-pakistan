import { resourceService } from '../services/resource.service.js';

export const resourceController = {
  async list(req, res, next) {
    try {
      res.json(await resourceService.listPublished(req.query));
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      res.json({ data: await resourceService.getPublished(req.params.id) });
    } catch (err) {
      next(err);
    }
  },
};

export const adminResourceController = {
  async list(req, res, next) {
    try {
      res.json(await resourceService.listAll({ page: req.query.page ?? 1, limit: req.query.limit ?? 50 }));
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      res.json({ data: await resourceService.getById(req.params.id) });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const resource = await resourceService.create(req.body);
      res.status(201).json({ data: resource });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      res.json({ data: await resourceService.update(req.params.id, req.body) });
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await resourceService.remove(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
