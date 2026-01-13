const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models/index');
const { protect } = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin' });
  }
  next();
};

// Barcha foydalanuvchilar ro'yxati
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'username', 'role', 'department'],
    order: [['role', 'ASC'], ['department', 'ASC']]
  });
  res.json(users);
});

// Yangi foydalanuvchi qo'shish (parol ixtiyoriy)
router.post('/user/create', protect, adminOnly, async (req, res) => {
  const { username, password, role, department } = req.body;

  if (!username || !role) {
    return res.status(400).json({ message: 'Login va rol majburiy' });
  }

  const finalPassword = password || '123456';

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(finalPassword, salt);

  try {
    const user = await User.create({
      username,
      password: hash,
      role,
      department: department || null
    });

    res.json({
      message: 'Foydalanuvchi qo‘shildi',
      user: { id: user.id, username, role, department: user.department }
    });
  } catch (err) {
    res.status(400).json({ message: 'Username band yoki xato yuz berdi' });
  }
});

// Foydalanuvchini tahrirlash (parol o'zgartirish qo'shildi)
router.put('/user/edit', protect, adminOnly, async (req, res) => {
  const { userId, role, department, password } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId majburiy' });

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    if (role) user.role = role;
    if (department !== undefined) user.department = department;

    // Agar parol kiritilsa → yangi parol o'rnatiladi
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: 'Muvaffaqiyatli o‘zgartirildi', user });
  } catch (err) {
    res.status(500).json({ message: 'Xato yuz berdi' });
  }
});

// Parolni reset qilish (123456 ga)
router.post('/user/reset', protect, adminOnly, async (req, res) => {
  const { userId } = req.body;
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash('123456', salt);
  await user.save();

  res.json({ message: 'Parol 123456 ga o‘zgartirildi' });
});

// Foydalanuvchini o'chirish
router.delete('/user/delete/:userId', protect, adminOnly, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

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