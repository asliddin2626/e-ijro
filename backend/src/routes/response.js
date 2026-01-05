const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Task, Response, User } = require('../models/index');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|zip/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    if (extname) cb(null, true);
    else cb(new Error('Noto‘g‘ri fayl formati!'));
  }
});

// Barcha topshiriqlar (tuman va viloyat uchun)
router.get('/all-tasks', protect, async (req, res) => {
  const tasks = await Task.findAll({
    include: [
      { model: User, as: 'creator', attributes: ['department'] },
      { 
        model: Response, 
        include: [{ model: User, as: 'responder', attributes: ['department'] }],
        order: [['submittedAt', 'ASC']]
      }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json(tasks);
});

// Javob yuborish
router.post('/submit/:taskId', protect, upload.array('files', 5), async (req, res) => {
  if (req.user.role !== 'tuman') return res.status(403).json({ message: 'Faqat tumanlar javob bera oladi' });

  const { taskId } = req.params;
  const { comment } = req.body;
  const files = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

  const existingResponse = await Response.findOne({ where: { taskId, responderId: req.user.id } });
  if (existingResponse) return res.status(400).json({ message: 'Siz allaqachon javob bergansiz' });

  const response = await Response.create({
    comment,
    taskId,
    responderId: req.user.id,
    // Fayllarni comment oxiriga qo'shamiz (keyinchalik alohida jadval qilamiz)
    rejectReason: files.length > 0 ? files.join('|||') : null
  });

  res.json({ message: 'Javob yuborildi!', response });
});

// Javobni qabul qilish yoki rad etish (viloyat uchun)
router.post('/review/:responseId', protect, async (req, res) => {
  if (req.user.role !== 'viloyat') return res.status(403).json({ message: 'Faqat viloyat bo‘limlari' });

  const { responseId } = req.params;
  const { status, rejectReason } = req.body; // status: 'accepted' yoki 'rejected'

  const response = await Response.findByPk(responseId, { include: [Task] });
  if (!response || response.Task.creatorId !== req.user.id) {
    return res.status(403).json({ message: 'Ruxsat yo‘q' });
  }

  response.status = status;
  if (rejectReason) response.rejectReason = rejectReason;
  await response.save();

  res.json({ message: 'Javob ko‘rib chiqildi', response });
});

module.exports = router;