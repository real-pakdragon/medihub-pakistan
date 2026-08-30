import { Router } from 'express';

import { resourceController, adminResourceController } from '../controllers/resource.controller.js';
import { mdcatController } from '../controllers/mdcat.controller.js';
import { practiceController } from '../controllers/practice.controller.js';
import { contactController, subscribeController } from '../controllers/contact.controller.js';
import { authController, statsController as dashboardStats } from '../controllers/auth.controller.js';
import { statsController } from '../controllers/stats.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { contactLimiter, subscribeLimiter, loginLimiter, readLimiter } from '../middleware/rateLimiters.js';
import {
  resourceQuerySchema,
  idParamSchema,
  contactSchema,
  subscribeSchema,
  loginSchema,
  resourceBodySchema,
  messageStatusSchema,
  adminMessageQuerySchema,
  mdcatConfigSchema,
  practiceQuestionsQuerySchema,
  practiceSubmitSchema,
} from '../validators/schemas.js';

const router = Router();

/* ------------------------------ Public ------------------------------ */

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.get('/stats', readLimiter, statsController.publicStats);

router.get('/resources', validate(resourceQuerySchema, 'query'), resourceController.list);
router.get('/resources/:id', validate(idParamSchema, 'params'), resourceController.getOne);

router.get('/mdcat/status', readLimiter, mdcatController.status);

router.get('/practice/papers', readLimiter, practiceController.papers);
router.get('/practice/questions', readLimiter, validate(practiceQuestionsQuerySchema, 'query'), practiceController.questions);
router.post('/practice/submit', contactLimiter, validate(practiceSubmitSchema), practiceController.submit);

router.post('/contact', contactLimiter, validate(contactSchema), contactController.submit);

router.post('/subscribe', subscribeLimiter, validate(subscribeSchema), subscribeController.subscribe);
router.get('/subscribe/confirm/:token', subscribeController.confirm);

/* ------------------------------- Admin ------------------------------ */

const admin = Router();

admin.post('/login', loginLimiter, validate(loginSchema), authController.login);

admin.use(requireAdmin);

admin.get('/me', authController.me);
admin.get('/stats', dashboardStats.dashboard);

admin
  .route('/resources')
  .get(adminResourceController.list)
  .post(validate(resourceBodySchema), adminResourceController.create);

admin
  .route('/resources/:id')
  .put(validate(resourceBodySchema), adminResourceController.update)
  .delete(validate(idParamSchema, 'params'), adminResourceController.remove);

admin.get('/messages', validate(adminMessageQuerySchema, 'query'), contactController.list);
admin.patch('/messages/:id', validate(idParamSchema, 'params'), validate(messageStatusSchema), contactController.updateStatus);

admin.get('/subscribers', subscribeController.list);

admin.get('/mdcat-config', mdcatController.status);
admin.put('/mdcat-config', validate(mdcatConfigSchema), mdcatController.update);

router.use('/admin', admin);

export default router;
