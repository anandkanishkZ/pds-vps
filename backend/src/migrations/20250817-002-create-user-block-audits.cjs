'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_block_audits', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      actingUserId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      action: { type: Sequelize.ENUM('block','unblock','extend'), allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: true },
      previousBlockedUntil: { type: Sequelize.DATE, allowNull: true },
      newBlockedUntil: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('user_block_audits',['userId','createdAt']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_block_audits');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_user_block_audits_action\";");
  }
};
