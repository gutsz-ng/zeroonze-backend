"use strict";

/**
 * MIGRATION: cria a tabela "categories" (ex.: Dragon Ball, One Piece).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("categories", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      // slug = versão do nome que pode ir na URL: "Dragon Ball" -> "dragon-ball"
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      // Se a categoria aparece no menu do site. BOOLEAN no MySQL vira 0 ou 1.
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("categories");
  },
};
