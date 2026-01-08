const express = require('express');
const router = express.Router();
const { Task } = require('../models/index');
const { protect } = require('../middleware/auth');

// Topshiriq yaratish
router.post('/create', protect, async (req, res) => {
  if (req.user.role !== 'viloyat') {
    return res.status(403).json({ message: 'Faqat viloyat bo\'limlari topshiriq yaratishi mumkin' });
  }

  const { title, description, deadline, answersVisible } = req.body;

  try {
    const task = await Task.create({
      title,
      description,
      deadline: deadline || null,
      answersVisible: answersVisible !== undefined ? answersVisible : true,
      creatorId: req.user.id
    });
    res.json({ message: 'Topshiriq yaratildi', task });
  } catch (err) {
    res.status(500).json({ message: 'Xato', error: err.message });
  }
});

// Topshiriqni o‘chirish (faqat admin)
router.delete('/delete/:taskId', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin o‘chirishi mumkin' });
  }

  const { taskId } = req.params;

  try {
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ message: 'Topshiriq topilmadi' });

    await task.destroy();
    res.json({ message: 'Topshiriq o‘chirildi' });
  } catch (err) {
    res.status(500).json({ message: 'Xato yuz berdi' });
  }
});

// O'z topshiriqlarini ko'rish
router.get('/my-tasks', protect, async (req, res) => {
  if (req.user.role !== 'viloyat') {
    return res.status(403).json({ message: 'Ruxsat yo\'q' });
  }

  const tasks = await Task.findAll({
    where: { creatorId: req.user.id },
    order: [['createdAt', 'DESC']]
  });
  res.json(tasks);
});

module.exports = router;