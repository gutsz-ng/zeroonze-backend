"use strict";

/**
 * MIGRATION: cria a tabela "product_images".
 *
 * Um produto tem VÁRIAS imagens (frente, costas, cor preta, cor branca).
 * Isso é uma relação "um para muitos" (1:N). Por isso a imagem guarda
 * o id do produto a que pertence: a coluna product_id, chamada de
 * CHAVE ESTRANGEIRA (foreign key).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_images", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // references: o banco só aceita um product_id que exista em products.id
        references: { model: "products", key: "id" },
        // CASCADE: se o produto for apagado, as imagens dele são apagadas junto,
        // em vez de ficarem "órfãs" no banco
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      enabled: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      // Caminho relativo do arquivo, ex.: "media/produtos/zoro.jpg"
      path: { type: Sequelize.STRING, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_images");
  },
};
