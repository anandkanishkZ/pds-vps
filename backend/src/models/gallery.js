import { DataTypes } from 'sequelize';

export default function GalleryModel(sequelize) {
  const Gallery = sequelize.define('Gallery', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('facility', 'products', 'events', 'achievements'),
      allowNull: false,
      defaultValue: 'events',
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'archived'),
      allowNull: false,
      defaultValue: 'active',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seoMeta: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  }, {
    tableName: 'gallery_items',
    timestamps: true,
    indexes: [
      {
        fields: ['category'],
      },
      {
        fields: ['featured'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['sortOrder'],
      },
    ],
  });

  return Gallery;
}
