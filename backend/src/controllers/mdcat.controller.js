import { mdcatService } from '../services/mdcat.service.js';

export const mdcatController = {
  async status(_req, res, next) {
    try {
      res.json(await mdcatService.getPublicStatus());
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const config = await mdcatService.updateConfig(req.body);
      res.json({
        data: { launchDate: config.launchDate.toISOString(), currentPhase: config.currentPhase, phaseDescription: config.phaseDescription },
      });
    } catch (err) {
      next(err);
    }
  },
};
