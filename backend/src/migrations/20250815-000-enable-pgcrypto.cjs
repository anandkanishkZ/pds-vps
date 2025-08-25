'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
  },
  async down() {
    // Leave extension installed
  }
};
