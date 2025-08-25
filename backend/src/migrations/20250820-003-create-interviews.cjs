module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interviews', {
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
      type: {
        type: Sequelize.ENUM('phone', 'video', 'in-person', 'technical', 'hr'),
        allowNull: false,
      },
      round: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER, // in minutes
        allowNull: false,
        defaultValue: 60,
      },
      interviewerIds: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      meetingLink: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled', 'no-show'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10,
        },
      },
      recommendForNextRound: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      conductedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('interviews', ['applicationId']);
    await queryInterface.addIndex('interviews', ['scheduledAt']);
    await queryInterface.addIndex('interviews', ['status']);
    await queryInterface.addIndex('interviews', ['createdBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('interviews');
  },
};
