import { Router } from 'express';

import { resourceController, adminResourceController } from '../controllers/resource.controller.js';
import { bookController } from '../controllers/book.controller.js';
import { libraryController } from '../controllers/library.controller.js';
import { mdcatController } from '../controllers/mdcat.controller.js';
import { practiceController } from '../controllers/practice.controller.js';
import { contactController, subscribeController } from '../controllers/contact.controller.js';
import { authController, statsController as dashboardStats } from '../controllers/auth.controller.js';
import { statsController } from '../controllers/stats.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingle } from '../middleware/upload.js';
import { contactLimiter, subscribeLimiter, loginLimiter, readLimiter } from '../middleware/rateLimiters.js';
import {
  resourceQuerySchema,
  idParamSchema,
  bookQuerySchema,
  slugParamSchema,
  categoryBodySchema,
  itemQuerySchema,
  itemBodySchema,
  postQuerySchema,
  postBodySchema,
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

router.get('/books/subjects', readLimiter, bookController.subjects);
router.get('/books', readLimiter, validate(bookQuerySchema, 'query'), bookController.list);
router.get('/books/:id', validate(idParamSchema, 'params'), bookController.getOne);

const withSection = (section) => (req, _res, next) => {
  req.section = section;
  next();
};

const libraryPublic = (section) => {
  const root = section === 'mbbs' ? '/library' : '/mdcat-res';
  router.get(`${root}/browse`, readLimiter, withSection(section), libraryController.browse);
  router.get(`${root}/recent`, readLimiter, withSection(section), libraryController.recent);
  router.get(`${root}/post/:id`, readLimiter, validate(idParamSchema, 'params'), withSection(section), libraryController.post);
  router.get(`${root}/topic/:slug`, readLimiter, validate(slugParamSchema, 'params'), withSection(section), libraryController.category);
};
libraryPublic('mbbs');
libraryPublic('mdcat');

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

const sectionAdmin = (section) => {
  const r = Router();
  r.use(withSection(section));

  r
    .route('/categories')
    .get(libraryController.categories)
    .post(validate(categoryBodySchema), libraryController.createCategory);

  r
    .route('/categories/:id')
    .put(validate(categoryBodySchema), libraryController.updateCategory)
    .delete(validate(idParamSchema, 'params'), libraryController.deleteCategory);

  r
    .route('/items')
    .get(validate(itemQuerySchema, 'query'), libraryController.items)
    .post(validate(itemBodySchema), libraryController.createItem);

  r
    .route('/items/:id')
    .put(validate(itemBodySchema), libraryController.updateItem)
    .delete(validate(idParamSchema, 'params'), libraryController.deleteItem);

  r
    .route('/posts')
    .get(validate(postQuerySchema, 'query'), libraryController.posts)
    .post(validate(postBodySchema), libraryController.createPost);

  r
    .route('/posts/:id')
    .put(validate(postBodySchema), libraryController.updatePost)
    .delete(validate(idParamSchema, 'params'), libraryController.deletePost);

  r.post('/upload', uploadSingle('file'), (req, res) => {
    const { file } = req;
    if (!file) return res.status(400).json({ error: { message: 'No file uploaded' } });
    res.status(201).json({
      data: {
        fileName: file.filename,
        filePath: `/files/library/${file.filename}`,
        fileSize: file.size,
        originalName: file.originalname,
      },
    });
  });

  return r;
};

admin.use('/library', sectionAdmin('mbbs'));
admin.use('/mdcat-res', sectionAdmin('mdcat'));

router.use('/admin', admin);

export default router;
