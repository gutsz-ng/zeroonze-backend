"use strict";

/**
 * MIGRATION: cria a tabela "users".
 *
 * O QUE É UMA MIGRATION?
 * É um arquivo que descreve UMA mudança no banco (criar tabela, adicionar
 * coluna...). Em vez de cada pessoa criar as tabelas na mão, todo mundo roda
 * "npm run db:migrate" e o banco fica idêntico em qualquer computador.
 * É como um "histórico de versões" do banco, igual ao Git é para o código.
 *
 * - up():   o que fazer para APLICAR a mudança (criar a tabela)
 * - down(): o que fazer para DESFAZER (apagar a tabela)
 *
 * O número no começo do nome do arquivo (data e hora) define a ordem
 * em que as migrations rodam. O Sequelize guarda quais já rodaram numa
 * tabela chamada "SequelizeMeta", então nunca roda a mesma duas vezes.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // identifica cada linha de forma única
        autoIncrement: true, // o banco gera 1, 2, 3... sozinho
        allowNull: false,
      },
      firstname: { type: Sequelize.STRING, allowNull: false },
      surname: { type: Sequelize.STRING, allowNull: false },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // o banco recusa dois usuários com o mesmo e-mail
      },
      // Guardamos o HASH da senha (gerado pelo bcrypt), nunca a senha em si
      password: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
