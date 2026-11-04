import { libraryService } from '../services/library.service.js';
import { createHttpError } from '../lib/httpError.js';

function send(res, promise, then = (data) => ({ data })) {
  return promise
    .then((result) => res.json(then(result)))
    .catch((err) => res.status(err.status ?? 500).json({ error: { message: err.message ?? 'Unexpected error' } }));
}

export const libraryController = {
  /* ----------------------------- Public ----------------------------- */

  async browse(req, res) {
    send(res, libraryService.browse(req.section));
  },

  async category(req, res) {
    send(res, libraryService.getCategory(req.params.slug, req.section));
  },

  async recent(req, res) {
    send(res, libraryService.recentItems(req.section));
  },

  async post(req, res) {
    send(res, libraryService.getPost(req.params.id, req.section));
  },

  /* ----------------------------- Admin ------------------------------ */

  async categories(req, res) {
    send(res, libraryService.listCategories(req.section));
  },

  async createCategory(req, res) {
    send(res, libraryService.createCategory(req.body, req.section));
  },

  async updateCategory(req, res) {
    send(res, libraryService.updateCategory(req.params.id, req.body, req.section));
  },

  async deleteCategory(req, res) {
    send(res, libraryService.deleteCategory(req.params.id, req.section));
  },

  async items(req, res) {
    send(res, libraryService.listItems(req.query, req.section));
  },

  async createItem(req, res) {
    send(res, libraryService.createItem(req.body, req.section));
  },

  async updateItem(req, res) {
    send(res, libraryService.updateItem(req.params.id, req.body, req.section));
  },

  async deleteItem(req, res) {
    send(res, libraryService.deleteItem(req.params.id, req.section));
  },

  /* ----------------------------- Posts (blog) ------------------------ */

  async posts(req, res) {
    send(res, libraryService.listPosts(req.query, req.section));
  },

  async createPost(req, res) {
    send(res, libraryService.createPost(req.body, req.section));
  },

  async updatePost(req, res) {
    send(res, libraryService.updatePost(req.params.id, req.body, req.section));
  },

  async deletePost(req, res) {
    send(res, libraryService.deletePost(req.params.id, req.section));
  },
};