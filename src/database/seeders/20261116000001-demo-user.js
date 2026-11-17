"use strict";

/**
 * SEEDER: cria um usuário de demonstração.
 *
 * O QUE É UM SEEDER?
 * "Seed" = semente. É um arquivo que coloca dados iniciais no banco,
 * para a API já começar com algo para mostrar e testar.
 * Rode com: npm run db:seed
 *
 * Login de demonstração:  admin@zeroonze.com  /  123@123
 */
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        firstname: "Admin",
        surname: "ZeroOnze",
        email: "admin@zeroonze.com",
        // Mesmo no seeder a senha é guardada como hash
        password: await bcrypt.hash("123@123", 10),
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: "admin@zeroonze.com" });
  },
};
