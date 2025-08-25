module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('application_timeline', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      action: {
        type: Sequelize.ENUM(
          'application_submitted',
          'application_reviewed',
          'application_shortlisted',
          'interview_scheduled',
          'interview_completed',
          'interview_cancelled',
          'offer_made',
          'offer_accepted',
          'offer_rejected',
          'application_rejected',
          'candidate_hired',
          'status_changed',
          'note_added'
        ),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      performedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('application_timeline', ['applicationId']);
    await queryInterface.addIndex('application_timeline', ['action']);
    await queryInterface.addIndex('application_timeline', ['performedBy']);
    await queryInterface.addIndex('application_timeline', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('application_timeline');
  },
};
