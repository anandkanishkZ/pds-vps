'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'avatar', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'department', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'location', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Notification preferences
    await queryInterface.addColumn('users', 'emailNotifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'pushNotifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'smsNotifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'marketingEmails', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'securityAlerts', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'systemUpdates', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'weeklyReports', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'instantAlerts', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Security settings
    await queryInterface.addColumn('users', 'twoFactorAuth', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'loginAlerts', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'sessionTimeout', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30
    });

    await queryInterface.addColumn('users', 'passwordExpiry', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 90
    });

    // Theme and preferences
    await queryInterface.addColumn('users', 'theme', {
      type: Sequelize.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system'
    });

    await queryInterface.addColumn('users', 'timezone', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'UTC'
    });

    await queryInterface.addColumn('users', 'language', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'en'
    });
  },

  async down(queryInterface, Sequelize) {
    const columns = [
      'phone', 'avatar', 'department', 'location', 'bio', 'lastLoginAt',
      'emailNotifications', 'pushNotifications', 'smsNotifications', 'marketingEmails',
      'securityAlerts', 'systemUpdates', 'weeklyReports', 'instantAlerts',
      'twoFactorAuth', 'loginAlerts', 'sessionTimeout', 'passwordExpiry',
      'theme', 'timezone', 'language'
    ];

    for (const column of columns) {
      await queryInterface.removeColumn('users', column);
    }
  }
};
