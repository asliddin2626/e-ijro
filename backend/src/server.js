const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { syncDB } = require('./models/index');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/task');
const responseRoutes = require('./routes/response');
const adminRoutes = require('./routes/admin');
const tahlilRoutes = require('./routes/tahlil');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API routelar
app.use('/api/auth', authRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/response', responseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tahlil', tahlilRoutes);

// Fayllar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Frontend fayllarini backend orqali xizmat qilish
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Barcha so‘rovlar uchun frontend index.html qaytarish
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

syncDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`e-ijro ishlayapti!`);
    console.log(`Mahalliy: http://localhost:${PORT}`);
    console.log(`Tarmoq: http://sizning_ip:${PORT}`);
  });
});