const { Model, DataTypes } = require("sequelize");

/**
 * Model da tabela "products".
 *
 * Os relacionamentos ficam em associate(). Com eles, uma única consulta
 * pode trazer o produto JÁ com imagens, opções e categorias:
 *   Product.findByPk(1, { include: ["images", "options", "categories"] })
 * O "as" de cada relação é o nome usado nesse include.
 */
module.exports = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      // 1:N — um produto tem muitas imagens
      Product.hasMany(models.ProductImage, { as: "images", foreignKey: "product_id" });
      // 1:N — um produto tem muitas opções
      Product.hasMany(models.ProductOption, { as: "options", foreignKey: "product_id" });
      // N:N — um produto está em muitas categorias
      Product.belongsToMany(models.Category, {
        through: models.ProductCategory,
        as: "categories",
        foreignKey: "product_id",
        otherKey: "category_id",
      });
    }
  }

  Product.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      enabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      stock: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      description: { type: DataTypes.STRING(1000), allowNull: true },
      price: { type: DataTypes.FLOAT, allowNull: false },
      price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
      sequelize,
      modelName: "Product",
      tableName: "products",
      underscored: true,
      timestamps: true,
    }
  );

  return Product;
};
