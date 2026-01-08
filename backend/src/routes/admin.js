const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models/index');
const { protect } = require('../middleware/auth');

// Faqat admin uchun
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin ruxsat etilgan' });
  }
  next();
};

// Barcha foydalanuvchilar
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'username', 'role', 'department'],
    order: [['role', 'ASC'], ['department', 'ASC']]
  });
  res.json(users);
});

// Yangi foydalanuvchi qo‘shish
router.post('/user/create', protect, adminOnly, async (req, res) => {
  const { username, password = '123456', role, department } = req.body;
  if (!username || !role) return res.status(400).json({ message: 'Majburiy maydonlar' });

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  try {
    const user = await User.create({ username, password: hash, role, department });
    res.json({ message: 'Qo‘shildi', user: { username, role, department } });
  } catch (err) {
    res.status(400).json({ message: 'Username band' });
  }
});

// Parolni reset qilish
router.post('/user/reset', protect, adminOnly, async (req, res) => {
  const { userId } = req.body;
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: 'Topilmadi' });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash('123456', salt);
  await user.save();
  res.json({ message: 'Parol 123456 ga o‘zgartirildi' });
});

// Foydalanuvchi statistikasi
router.get('/stats/users', protect, adminOnly, async (req, res) => {
  const users = await User.findAll({
    attributes: ['role', 'department']
  });

  const byRole = {
    admin: 0,
    tahlilchi: 0,
    viloyat: 0,
    tuman: 0
  };

  const byDepartment = {};

  users.forEach(u => {
    byRole[u.role]++;
    const dept = u.department || 'Bo‘lim nomi yo‘q';
    byDepartment[dept] = (byDepartment[dept] || 0) + 1;
  });

  res.json({
    total: users.length,
    byRole,
    byDepartment: Object.entries(byDepartment).map(([dept, count]) => ({ department: dept, count }))
  });
});


// Foydalanuvchini o‘chirish (YANGI)
router.delete('/user/delete/:userId', protect, adminOnly, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    // Admin o‘zini o‘chira olmasin
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'O‘zingizni o‘chira olmaysiz' });
    }

    await user.destroy();
    res.json({ message: 'Foydalanuvchi o‘chirildi' });
  } catch (err) {
    res.status(500).json({ message: 'Xato yuz berdi' });
  }
});

module.exports = router;