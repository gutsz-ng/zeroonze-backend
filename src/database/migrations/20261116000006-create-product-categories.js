"use strict";

/**
 * MIGRATION: cria a tabela "product_categories".
 *
 * Um produto pode estar em VÁRIAS categorias (ex.: "Dragon Ball" e
 * "Destaques"), e uma categoria tem VÁRIOS produtos. Isso é uma relação
 * "muitos para muitos" (N:N). Bancos relacionais resolvem isso com uma
 * TABELA INTERMEDIÁRIA (ou "tabela pivô"): cada linha liga um produto
 * a uma categoria.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_categories", {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "categories", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      // As duas colunas juntas formam a chave primária ("chave composta"):
      // assim o mesmo produto não entra duas vezes na mesma categoria.
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_categories");
  },
};
