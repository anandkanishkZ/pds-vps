import { DataTypes, Model } from 'sequelize';

class ProductMedia extends Model {}

export default (sequelize) => {
  ProductMedia.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  productId: { type: DataTypes.UUID, allowNull: true }, // nullable: global media
    type: { type: DataTypes.ENUM('image','spec','msds','brochure'), allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    altText: { type: DataTypes.STRING, allowNull: true },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    meta: { type: DataTypes.JSONB, allowNull: true },
    checksum: { type: DataTypes.STRING, allowNull: true }
  }, { sequelize, modelName: 'ProductMedia', tableName: 'product_media', timestamps: true });
  return ProductMedia;
};
