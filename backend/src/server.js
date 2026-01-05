const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { syncDB } = require('./models/index');
const authRoutes = require('./routes/auth');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'e-ijro backend ishlayapti! 🚀' });
});

app.use('/api/auth', authRoutes);
const taskRoutes = require('./routes/task');
app.use('/api/task', taskRoutes);

const responseRoutes = require('./routes/response');
app.use('/api/response', responseRoutes);

// Fayllarni statik qilish (uploads papkasini ko'rish uchun)
app.use('/uploads', express.static('uploads'));


const PORT = process.env.PORT || 5000;

syncDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} da ishga tushdi`);
  });
});