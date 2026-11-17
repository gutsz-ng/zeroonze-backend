const { Model, DataTypes } = require("sequelize");

/**
 * Model da tabela intermediária "product_categories" (N:N).
 *
 * As duas colunas são primaryKey. Se não disséssemos isso, o Sequelize
 * tentaria usar uma coluna "id" que essa tabela não tem.
 */
module.exports = (sequelize) => {
  class ProductCategory extends Model {}

  ProductCategory.init(
    {
      product_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      category_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    },
    {
      sequelize,
      modelName: "ProductCategory",
      tableName: "product_categories",
      underscored: true,
      timestamps: false,
    }
  );

  return ProductCategory;
};
