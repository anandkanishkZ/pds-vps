'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_pack_sizes', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      productId: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      displayLabel: { type: Sequelize.STRING, allowNull: false },
      numericValue: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      unit: { type: Sequelize.ENUM('LTR','ML','GAL','KG','GM','DRUM'), allowNull: true },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('product_pack_sizes', ['productId']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('product_pack_sizes');
  }
};
