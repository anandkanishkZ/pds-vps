'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hero_slides', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.literal('gen_random_uuid()') },
      title: { type: Sequelize.STRING, allowNull: true },
      subtitle: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      imageUrl: { type: Sequelize.TEXT, allowNull: false },
      mobileImageUrl: { type: Sequelize.TEXT, allowNull: true },
      altText: { type: Sequelize.STRING, allowNull: true },
      ctaLabel: { type: Sequelize.STRING, allowNull: true },
      ctaUrl: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active','draft','archived'), allowNull: false, defaultValue: 'active' },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      startAt: { type: Sequelize.DATE, allowNull: true },
      endAt: { type: Sequelize.DATE, allowNull: true },
      meta: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('hero_slides', ['status']);
    await queryInterface.addIndex('hero_slides', ['sortOrder']);
    await queryInterface.addIndex('hero_slides', ['startAt']);
    await queryInterface.addIndex('hero_slides', ['endAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hero_slides');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_hero_slides_status\";");
  }
};
