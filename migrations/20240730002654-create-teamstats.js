'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TeamStats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      teamName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      wins: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      games: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      goalsFor: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      goalsAgainst: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TeamStats');
  }
};
