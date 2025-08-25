'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add status ENUM type column (active, inactive, pending)
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'pending'),
      allowNull: false,
      defaultValue: 'active'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'status');
    // Need to drop enum type explicitly in Postgres
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_users_status\";");
    }
  }
};
