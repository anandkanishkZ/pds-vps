import { DataTypes, Model } from 'sequelize';

class ProductFeature extends Model {}

export default (sequelize) => {
  ProductFeature.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    productId: { type: DataTypes.UUID, allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, { sequelize, modelName: 'ProductFeature', tableName: 'product_features', timestamps: true });
  return ProductFeature;
};
