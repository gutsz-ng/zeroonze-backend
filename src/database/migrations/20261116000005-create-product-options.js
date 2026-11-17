"use strict";

/**
 * MIGRATION: cria a tabela "product_options".
 *
 * Opções são as escolhas que o cliente faz no produto, como
 * "Tamanho" (P, M, G, GG) e "Cor" (preto, branco).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_options", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      title: { type: Sequelize.STRING, allowNull: false },
      // ENUM = a coluna só aceita os valores da lista
      shape: {
        type: Sequelize.ENUM("square", "circle"),
        allowNull: true,
        defaultValue: "square",
      },
      radius: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      type: {
        type: Sequelize.ENUM("text", "color"),
        allowNull: true,
        defaultValue: "text",
      },
      // Todas as opções separadas por vírgula: "P,M,G,GG"
      // (VALUES é palavra reservada no MySQL, mas o Sequelize coloca o
      // nome entre crases `values`, então funciona sem problema)
      values: { type: Sequelize.STRING, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_options");
  },
};
