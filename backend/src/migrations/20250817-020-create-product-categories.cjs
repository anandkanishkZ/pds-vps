'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING(16), allowNull: true },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      shortDescription: { type: Sequelize.TEXT, allowNull: true },
      longDescription: { type: Sequelize.TEXT, allowNull: true },
      heroImageUrl: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active','coming_soon','archived'), allowNull: false, defaultValue: 'active' },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      seoMeta: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('product_categories', ['slug'], { unique: true, name: 'ux_product_categories_slug' });
    await queryInterface.addIndex('product_categories', ['status']);
    await queryInterface.addIndex('product_categories', ['sortOrder']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('product_categories');
  }
};
