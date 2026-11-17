"use strict";

/**
 * SEEDER: as categorias da loja (os animes), mais duas coleções
 * que o site usa: "Lançamentos" e "Destaques" (fora do menu).
 * Os dados ficam em src/database/data/categorias.json.
 */
const categorias = require("../data/categorias.json");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      "categories",
      categorias.map((c) => ({ ...c, created_at: now, updated_at: now }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("categories", { id: categorias.map((c) => c.id) });
  },
};
