const bcrypt = require('bcrypt');
const { User, sequelize } = require('./src/models/index');

async function createDemoUsers() {
  await sequelize.sync({ alter: true });

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);

  const users = [
    { username: 'admin', role: 'admin', department: 'Admin' }, // yangi admin
    { username: 'tahlilchi', role: 'tahlilchi', department: 'Tahlilchi' },
    { username: 'viloyat1', role: 'viloyat', department: 'Viloyat bo\'lim 1' },
    ...Array.from({ length: 15 }, (_, i) => ({
      username: `tuman${i + 1}`,
      role: 'tuman',
      department: `Tuman ${i + 1}`
    }))
  ];

  for (let u of users) {
    await User.upsert({
      username: u.username,
      password: hash,
      role: u.role,
      department: u.department
    });
  }

  console.log('Demo foydalanuvchilar yaratildi! Admin login: admin / 123456');
  process.exit();
}

createDemoUsers().catch(err => console.error(err));