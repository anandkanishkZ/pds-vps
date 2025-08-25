import { DataTypes, Model } from 'sequelize';

class ProductApplication extends Model {}

export default (sequelize) => {
  ProductApplication.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    productId: { type: DataTypes.UUID, allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, { sequelize, modelName: 'ProductApplication', tableName: 'product_applications', timestamps: true });
  return ProductApplication;
};
