'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add metadata column to inquiries table
    await queryInterface.addColumn('inquiries', 'metadata', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Additional tracking information for security and analytics'
    });

    // Add index on ip_address for bulk submission detection
    await queryInterface.addIndex('inquiries', ['ip_address']);
    
    // Add index on created_at and ip_address combination for rate limiting queries
    await queryInterface.addIndex('inquiries', ['ip_address', 'created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('inquiries', ['ip_address', 'created_at']);
    await queryInterface.removeIndex('inquiries', ['ip_address']);
    await queryInterface.removeColumn('inquiries', 'metadata');
  }
};
