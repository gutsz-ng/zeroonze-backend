const { Model, DataTypes } = require("sequelize");

/** Model da tabela "categories". */
module.exports = (sequelize) => {
  class Category extends Model {
    static associate(models) {
      // N:N — uma categoria tem muitos produtos, através de product_categories
      Category.belongsToMany(models.Product, {
        through: models.ProductCategory,
        as: "products",
        foreignKey: "category_id",
        otherKey: "product_id",
      });
    }
  }

  Category.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Category",
      tableName: "categories",
      underscored: true,
      timestamps: true,
    }
  );

  return Category;
};
