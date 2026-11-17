const { Model, DataTypes } = require("sequelize");

/** Model da tabela "product_images". */
module.exports = (sequelize) => {
  class ProductImage extends Model {
    static associate(models) {
      // O outro lado do 1:N: cada imagem pertence a um produto
      ProductImage.belongsTo(models.Product, { as: "product", foreignKey: "product_id" });
    }
  }

  ProductImage.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      path: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "ProductImage",
      tableName: "product_images",
      underscored: true,
      timestamps: false, // a tabela não tem created_at/updated_at (o requisito não pede)
    }
  );

  return ProductImage;
};
