/**
 * Ponto central dos MODELS (o "M" do MVC).
 *
 * O QUE É UM MODEL?
 * É uma classe JavaScript que representa uma tabela. Com ela você escreve
 *   Product.findByPk(1)
 * e o Sequelize (o ORM) traduz para SQL:
 *   SELECT * FROM products WHERE id = 1;
 * ORM = Object-Relational Mapping: "mapeia" tabelas para objetos.
 *
 * Este arquivo:
 *  1. cria a conexão com o banco (uma só, compartilhada pela API toda);
 *  2. carrega cada model;
 *  3. chama associate() de cada um, para ligar os relacionamentos.
 *
 * Quem precisa de um model faz: const { Product } = require("../models");
 */
const { Sequelize } = require("sequelize");
const allConfigs = require("../config/database");

const env = process.env.NODE_ENV || "development";
const config = allConfigs[env];

// Criar a instância NÃO conecta ainda. A conexão só abre na primeira consulta.
const sequelize = new Sequelize(config.database, config.username, config.password, config);

const models = {
  User: require("./User")(sequelize),
  Category: require("./Category")(sequelize),
  Product: require("./Product")(sequelize),
  ProductImage: require("./ProductImage")(sequelize),
  ProductOption: require("./ProductOption")(sequelize),
  ProductCategory: require("./ProductCategory")(sequelize),
};

// Os relacionamentos só podem ser ligados depois que TODOS os models existem
Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") model.associate(models);
});

module.exports = { sequelize, Sequelize, ...models };
