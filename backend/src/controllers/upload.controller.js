import { uploadService } from '../services/upload.service.js';

function send(res, promise, status = 200) {
  return promise
    .then((data) => res.status(status).json({ data }))
    .catch((err) =>
      res.status(err.status ?? 500).json({ error: { message: err.message ?? 'Unexpected error' } })
    );
}

export const uploadController = {
  init(req, res) {
    send(res, uploadService.initUpload(req.body), 201);
  },

  chunk(req, res) {
    send(res, uploadService.saveChunk(req.params.uploadId, req.params.index, req.body));
  },

  complete(req, res) {
    send(res, uploadService.completeUpload(req.params.uploadId), 201);
  },

  abort(req, res) {
    send(res, uploadService.abortUpload(req.params.uploadId));
  },
};
