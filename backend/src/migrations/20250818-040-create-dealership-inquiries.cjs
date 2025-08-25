'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dealership_inquiries', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      company_name: { type: Sequelize.STRING, allowNull: false },
      contact_person: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: true },
      location: { type: Sequelize.STRING, allowNull: true },
      business_type: { type: Sequelize.STRING, allowNull: true },
      years_in_business: { type: Sequelize.INTEGER, allowNull: true },
      current_brands: { type: Sequelize.STRING, allowNull: true },
      monthly_volume: { type: Sequelize.STRING, allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('new', 'in_progress', 'resolved', 'closed'), allowNull: false, defaultValue: 'new' },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'), allowNull: false, defaultValue: 'medium' },
      source: { type: Sequelize.STRING, allowNull: false, defaultValue: 'website' },
      ip_address: { type: Sequelize.STRING, allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      assigned_to: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
      resolved_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      admin_notes: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('dealership_inquiries', ['status']);
    await queryInterface.addIndex('dealership_inquiries', ['priority']);
    await queryInterface.addIndex('dealership_inquiries', ['created_at']);
    await queryInterface.addIndex('dealership_inquiries', ['email']);
    await queryInterface.addIndex('dealership_inquiries', ['assigned_to']);
    await queryInterface.addIndex('dealership_inquiries', ['company_name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dealership_inquiries');
  }
};
