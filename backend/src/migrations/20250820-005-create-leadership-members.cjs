'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leadership_members', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: true },
      shortBio: { type: Sequelize.TEXT, allowNull: true },
      fullBio: { type: Sequelize.TEXT, allowNull: true },
      imageUrl: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active','archived'), allowNull: false, defaultValue: 'active' },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      social: { type: Sequelize.JSONB, allowNull: true },
      meta: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('leadership_members', ['status']);
    await queryInterface.addIndex('leadership_members', ['sortOrder']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('leadership_members');
  }
};
