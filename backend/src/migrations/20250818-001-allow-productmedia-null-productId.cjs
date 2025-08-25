'use strict';

/**
 * Allow product_media.productId to be nullable so media can exist unattached (global library uploads).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make productId nullable so global (unattached) media can be stored
    await queryInterface.changeColumn('product_media', 'productId', {
      type: Sequelize.UUID,
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    // Revert to NOT NULL (will fail if null rows exist)
    await queryInterface.changeColumn('product_media', 'productId', {
      type: Sequelize.UUID,
      allowNull: false
    });
  }
};
