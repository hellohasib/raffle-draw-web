const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Participant = sequelize.define('Participant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ticketNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  raffleDrawId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'raffle_draws',
      key: 'id'
    }
  },
  isWinner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  prizeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'prizes',
      key: 'id'
    }
  }
}, {
  tableName: 'participants',
  timestamps: true
});

module.exports = Participant;
