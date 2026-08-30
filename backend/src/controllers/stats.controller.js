import { resourceService } from '../services/resource.service.js';
import { subscriberService } from '../services/contact.service.js';

export const statsController = {
  async publicStats(_req, res, next) {
    try {
      const [resourceStats, studentsConnected] = await Promise.all([
        resourceService.publicStats(),
        subscriberService.studentsConnected(),
      ]);
      res.json({ data: { ...resourceStats, studentsConnected } });
    } catch (err) {
      next(err);
    }
  },
};
