const { Sequelize } = require('sequelize');

// Option 1: Use the provided credentials
const sequelize = new Sequelize('raffle_draw', 'sigmind', '$!gmind9876!', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

// Option 2: If you want to use different credentials, uncomment and modify this:
/*
const sequelize = new Sequelize('raffle_draw', 'your_username', 'your_password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});
*/

// Option 3: If you want to use environment variables, uncomment this:
/*
const sequelize = new Sequelize(
  process.env.DB_NAME || 'raffle_draw',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);
*/

module.exports = sequelize;
