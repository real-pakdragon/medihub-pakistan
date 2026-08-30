import { adminService } from '../services/admin.service.js';

export const authController = {
  async login(req, res, next) {
    try {
      const result = await adminService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      res.json({ data: { id: req.admin.id, email: req.admin.email, role: req.admin.role } });
    } catch (err) {
      next(err);
    }
  },
};

export const statsController = {
  async dashboard(_req, res, next) {
    try {
      res.json({ data: await adminService.dashboardStats() });
    } catch (err) {
      next(err);
    }
  },
};
