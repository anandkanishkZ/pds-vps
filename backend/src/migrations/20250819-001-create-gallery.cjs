'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gallery_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('facility', 'products', 'events', 'achievements'),
        allowNull: false,
        defaultValue: 'events',
      },
      imageUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'archived'),
        allowNull: false,
        defaultValue: 'active',
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      seoMeta: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex('gallery_items', ['category']);
    await queryInterface.addIndex('gallery_items', ['featured']);
    await queryInterface.addIndex('gallery_items', ['status']);
    await queryInterface.addIndex('gallery_items', ['date']);
    await queryInterface.addIndex('gallery_items', ['sortOrder']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gallery_items');
  }
};
