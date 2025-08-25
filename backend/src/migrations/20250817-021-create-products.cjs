'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      categoryId: { type: Sequelize.UUID, allowNull: false, references: { model: 'product_categories', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      shortDescription: { type: Sequelize.TEXT, allowNull: true },
      longDescription: { type: Sequelize.TEXT, allowNull: true },
      imageUrl: { type: Sequelize.TEXT, allowNull: true },
      viscosity: { type: Sequelize.STRING, allowNull: true },
      apiGrade: { type: Sequelize.STRING, allowNull: true },
      healthSafety: { type: Sequelize.TEXT, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      meta: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('products', ['slug'], { unique: true, name: 'ux_products_slug' });
    await queryInterface.addIndex('products', ['categoryId']);
    await queryInterface.addIndex('products', ['isActive']);
    await queryInterface.addIndex('products', ['viscosity']);
    await queryInterface.addIndex('products', ['apiGrade']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
