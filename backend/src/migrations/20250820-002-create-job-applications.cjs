module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      jobPostingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_postings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      applicantName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      experience: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      coverLetter: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resumeUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resumeFileName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'reviewing', 'shortlisted', 'interview-scheduled', 'interviewed', 'offered', 'hired', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      linkedInProfile: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      portfolioUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentSalary: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expectedSalary: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      noticePeriod: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      appliedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewedBy: {
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
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('job_applications', ['jobPostingId']);
    await queryInterface.addIndex('job_applications', ['email']);
    await queryInterface.addIndex('job_applications', ['status']);
    await queryInterface.addIndex('job_applications', ['priority']);
    await queryInterface.addIndex('job_applications', ['reviewedBy']);
    await queryInterface.addIndex('job_applications', ['appliedAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_applications');
  },
};
