'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_media', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      productId: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('image','spec','msds','brochure'), allowNull: false },
      url: { type: Sequelize.TEXT, allowNull: false },
      altText: { type: Sequelize.STRING, allowNull: true },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      meta: { type: Sequelize.JSONB, allowNull: true },
      checksum: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('product_media', ['productId']);
    await queryInterface.addIndex('product_media', ['type']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('product_media');
  }
};
