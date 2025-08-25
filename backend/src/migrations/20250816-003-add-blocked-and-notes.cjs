'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('ALTER TYPE "enum_users_status" ADD VALUE IF NOT EXISTS ' + "'blocked'" + ';');
    }
    const table = await queryInterface.describeTable('users');
    if (!table.adminNotes) {
      await queryInterface.addColumn('users', 'adminNotes', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!table.blockedAt) {
      await queryInterface.addColumn('users', 'blockedAt', { type: Sequelize.DATE, allowNull: true });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');
    if (table.adminNotes) {
      await queryInterface.removeColumn('users', 'adminNotes');
    }
    if (table.blockedAt) {
      await queryInterface.removeColumn('users', 'blockedAt');
    }
  }
};
