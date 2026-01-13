const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Response, Task, User } = require('../models/index');
const { protect } = require('../middleware/auth');

// Fayllarni saqlash
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/responses');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Javob yuborish / yangilash (tuman bo‘limi)
router.post('/submit/:taskId', protect, upload.array('files', 10), async (req, res) => {
  if (req.user.role !== 'tuman') {
    return res.status(403).json({ message: 'Faqat tuman bo‘limi javob bera oladi' });
  }

  const { taskId } = req.params;
  const { comment } = req.body;
  const files = req.files || [];

  const task = await Task.findByPk(taskId);
  if (!task) return res.status(404).json({ message: 'Topshiriq topilmadi' });

  // Fayllar yo‘llarini saqlash
  const filePaths = files.map(file => `/uploads/responses/${file.filename}`);
  const filePathsString = filePaths.join('|||');

  // Agar oldin javob berilgan bo‘lsa – yangilash
  let response = await Response.findOne({
    where: { taskId, responderId: req.user.id }
  });

  if (response) {
    // Yangilash
    response.comment = comment;
    response.rejectReason = filePathsString;
    response.status = 'pending';
    await response.save();
  } else {
    // Yangi javob
    response = await Response.create({
      taskId,
      responderId: req.user.id,
      comment,
      rejectReason: filePathsString,
      status: 'pending'
    });
  }

  res.json({ message: 'Javob yuborildi/yangilandi', response });
});

// Javobni ko‘rib chiqish (viloyat bo‘limi)
router.post('/review/:responseId', protect, async (req, res) => {
  if (req.user.role !== 'viloyat') {
    return res.status(403).json({ message: 'Faqat viloyat bo‘limi ko‘rib chiqishi mumkin' });
  }

  const { responseId } = req.params;
  const { status, rejectReason } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status faqat accepted yoki rejected bo‘lishi mumkin' });
  }

  const response = await Response.findByPk(responseId, {
    include: [{ model: Task }]
  });

  if (!response) return res.status(404).json({ message: 'Javob topilmadi' });

  // Faqat o‘z topshirig‘iga javob berishi mumkin
  if (response.Task.creatorId !== req.user.id) {
    return res.status(403).json({ message: 'Bu topshiriq sizniki emas' });
  }

  response.status = status;
  if (status === 'rejected') {
    response.rejectReason = rejectReason || 'Sabab kiritilmagan';
  } else {
    response.rejectReason = null; // qabul qilinganda izoh o‘chiriladi
  }

  await response.save();

  res.json({ message: `Javob ${status === 'accepted' ? 'qabul qilindi' : 'rad etildi'}`, response });
});

// Barcha topshiriqlar va javoblarni olish
router.get('/all-tasks', protect, async (req, res) => {
  const tasks = await Task.findAll({
    include: [
      {
        model: Response,
        include: [
          {
            model: User,
            as: 'responder',
            attributes: ['id', 'username', 'department']
          }
        ]
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'department']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json(tasks);
});

module.exports = router;