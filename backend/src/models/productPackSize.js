import { DataTypes, Model } from 'sequelize';

class ProductPackSize extends Model {}

export default (sequelize) => {
  ProductPackSize.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    productId: { type: DataTypes.UUID, allowNull: false },
    displayLabel: { type: DataTypes.STRING, allowNull: false },
    numericValue: { type: DataTypes.DECIMAL(10,2), allowNull: true },
    unit: { type: DataTypes.ENUM('LTR','ML','GAL','KG','GM','DRUM'), allowNull: true },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, { sequelize, modelName: 'ProductPackSize', tableName: 'product_pack_sizes', timestamps: true });
  return ProductPackSize;
};
