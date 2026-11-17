/**
 * Configuração do banco de dados.
 *
 * Este arquivo é lido por DOIS lugares:
 *  1. pelo sequelize-cli, quando você roda "npm run db:migrate" ou "db:seed";
 *  2. por src/models/index.js, quando a API conecta no banco.
 *
 * O sequelize-cli exige este formato: um objeto com um bloco por
 * ambiente (development, test, production). O ambiente usado vem de
 * process.env.NODE_ENV. Se ninguém definir, é "development".
 */
require("dotenv").config();

const base = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || "zeroonze",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  dialect: "mysql", // qual banco usamos. O pacote "mysql2" é o "tradutor".
  logging: false, // true mostra no terminal cada SQL gerado (bom para estudar)
  define: {
    // underscored: os campos ficam em snake_case no banco
    // (created_at, product_id) em vez de camelCase (createdAt, productId)
    underscored: true,
    // timestamps: o Sequelize preenche created_at e updated_at sozinho
    timestamps: true,
  },
};

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: base,
};
