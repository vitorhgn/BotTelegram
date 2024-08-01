'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TeamStats', 'data', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('TeamStats', 'data');
  }
};
