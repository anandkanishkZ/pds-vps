module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_postings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jobType: {
        type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'internship'),
        allowNull: false,
        defaultValue: 'full-time',
      },
      experienceLevel: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      requirements: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      benefits: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      salaryRange: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      isHot: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      applicationDeadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      positionsAvailable: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      skills: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
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

    await queryInterface.addIndex('job_postings', ['department']);
    await queryInterface.addIndex('job_postings', ['location']);
    await queryInterface.addIndex('job_postings', ['jobType']);
    await queryInterface.addIndex('job_postings', ['isActive']);
    await queryInterface.addIndex('job_postings', ['createdBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_postings');
  },
};
