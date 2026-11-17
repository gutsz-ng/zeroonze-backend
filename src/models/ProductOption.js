const { Model, DataTypes } = require("sequelize");

/** Model da tabela "product_options". */
module.exports = (sequelize) => {
  class ProductOption extends Model {
    static associate(models) {
      ProductOption.belongsTo(models.Product, { as: "product", foreignKey: "product_id" });
    }
  }

  ProductOption.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      shape: {
        type: DataTypes.ENUM("square", "circle"),
        allowNull: true,
        defaultValue: "square",
      },
      radius: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      type: {
        type: DataTypes.ENUM("text", "color"),
        allowNull: true,
        defaultValue: "text",
      },
      values: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "ProductOption",
      tableName: "product_options",
      underscored: true,
      timestamps: false,
    }
  );

  return ProductOption;
};
