const router  = require('express').Router();
const multer  = require('multer');
const { v4: uuid } = require('uuid');
const sb      = require('../services/supabase');
const auth    = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });

    const bucket = req.body.bucket || 'imoveis';
    const ext    = req.file.originalname.split('.').pop();
    const path   = `${bucket}/${uuid()}.${ext}`;

    const { error } = await sb.storage.from(bucket).upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });
    if (error) throw error;

    const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(path);
    res.json({ url: publicUrl, path, originalName: req.file.originalname });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
