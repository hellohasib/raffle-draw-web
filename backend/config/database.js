const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('raffle_draw', 'sigmind', '$!gmind9876!', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
