/** Add blockedUntil column to users for timed suspensions */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'blockedUntil', {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'blocked_until'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'blockedUntil');
  }
};
