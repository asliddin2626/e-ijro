const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('viloyat', 'tuman', 'tahlilchi'), allowNull: false },
  department: { type: DataTypes.STRING },
});

const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  deadline: { type: DataTypes.DATE },
  answersVisible: { type: DataTypes.BOOLEAN, defaultValue: true }, // javoblar ko'rinsinmi
});

const Response = sequelize.define('Response', {
  comment: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected'), defaultValue: 'pending' },
  rejectReason: { type: DataTypes.TEXT },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// Bog'lanishlar
Task.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(Task, { foreignKey: 'creatorId' });

Response.belongsTo(Task, { foreignKey: 'taskId' });
Task.hasMany(Response, { foreignKey: 'taskId' });

Response.belongsTo(User, { as: 'responder', foreignKey: 'responderId' });
User.hasMany(Response, { foreignKey: 'responderId' });

async function syncDB() {
  await sequelize.sync({ alter: true });
  console.log('DB synced');
}

module.exports = { User, Task, Response, syncDB, sequelize };