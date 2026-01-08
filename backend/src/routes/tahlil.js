const express = require('express');
const router = express.Router();
const { Task, Response, User } = require('../models/index');
const { protect } = require('../middleware/auth');

const tahlilchiOnly = (req, res, next) => {
  if (req.user.role !== 'tahlilchi') {
    return res.status(403).json({ message: 'Faqat tahlilchi' });
  }
  next();
};

// Topshiriqlar statistikasi
router.get('/stats', protect, tahlilchiOnly, async (req, res) => {
  const tasks = await Task.findAll({
    include: [{ model: Response, include: [{ model: User, as: 'responder' }] }]
  });

  const stats = {
    totalTasks: tasks.length,
    totalResponses: 0,
    accepted: 0,
    pending: 0,
    rejected: 0,
    lateTasks: 0,
    byDepartment: {}
  };

  const today = new Date();

  tasks.forEach(task => {
    const responses = task.Responses || [];
    stats.totalResponses += responses.length;
    stats.accepted += responses.filter(r => r.status === 'accepted').length;
    stats.pending += responses.filter(r => r.status === 'pending').length;
    stats.rejected += responses.filter(r => r.status === 'rejected').length;

    if (task.deadline && new Date(task.deadline) < today && responses.length === 0) {
      stats.lateTasks++;
    }

    responses.forEach(resp => {
      const dept = resp.responder?.department || 'Noma\'lum';
      if (!stats.byDepartment[dept]) stats.byDepartment[dept] = { responses: 0, accepted: 0 };
      stats.byDepartment[dept].responses++;
      if (resp.status === 'accepted') stats.byDepartment[dept].accepted++;
    });
  });

  res.json(stats);
});

module.exports = router;