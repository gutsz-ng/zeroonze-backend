"use strict";

/**
 * MIGRATION: cria a tabela "products" (as camisetas).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // enabled = produto à venda (1) ou escondido (0)
      enabled: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      stock: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      // STRING sem número vira VARCHAR(255). As descrições da loja podem
      // passar disso, então damos mais espaço (continua sendo STRING).
      description: { type: Sequelize.STRING(1000), allowNull: true },
      price: { type: Sequelize.FLOAT, allowNull: false },
      price_with_discount: { type: Sequelize.FLOAT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("products");
  },
};
