const bcrypt = require('bcrypt');
const { User } = require('./src/models/index');

async function createUsers() {
  const salt = await bcrypt.genSalt(10);

  const users = [
    { username: 'tahlilchi', password: '123456', role: 'tahlilchi', department: 'Tahlilchi' },
    { username: 'viloyat1', password: '123456', role: 'viloyat', department: 'Viloyat bo\'lim 1' },
    ...Array.from({ length: 15 }, (_, i) => ({
      username: `tuman${i + 1}`,
      password: '123456',
      role: 'tuman',
      department: `Tuman ${i + 1}`
    }))
  ];

  for (let u of users) {
    const hash = await bcrypt.hash(u.password, salt);
    await User.findOrCreate({
      where: { username: u.username },
      defaults: { ...u, password: hash }
    });
  }

  console.log('Demo foydalanuvchilar yaratildi!');
  process.exit();
}

createUsers();