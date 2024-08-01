const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamStats = sequelize.define('TeamStats', {
  teamName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  wins: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  games: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  goalsFor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  goalsAgainst: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = TeamStats;
