const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const TeamStats = require('./teamStats');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.TeamStats = TeamStats;

module.exports = db;
