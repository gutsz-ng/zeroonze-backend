"use strict";

/**
 * SEEDER: as 16 camisetas do site, com imagens, opções e categorias.
 *
 * Os dados vêm de src/database/data/produtos.json, gerado a partir do
 * catálogo do front-end (zeroonze-geekstrt), para a API e o site
 * mostrarem os mesmos produtos.
 *
 * As fotos já estão em public/media/produtos/.
 */
const produtos = require("../data/produtos.json");

// Mesmas opções para todas as camisetas
const TAMANHOS = { title: "Tamanho", shape: "square", radius: 4, type: "text", values: "P,M,G,GG" };
const CORES = {
  preto: { title: "Cor", shape: "circle", radius: 0, type: "color", values: "#000000,#FFFFFF" },
  branco: { title: "Cor", shape: "circle", radius: 0, type: "color", values: "#FFFFFF,#000000" },
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1) Produtos (com id fixo, para as tabelas ligadas saberem a quem apontar)
    await queryInterface.bulkInsert(
      "products",
      produtos.map((p) => ({
        id: p.id,
        enabled: true,
        name: p.name,
        slug: p.slug,
        use_in_menu: false,
        stock: 50,
        description: p.description,
        price: p.price,
        price_with_discount: p.price,
        created_at: now,
        updated_at: now,
      }))
    );

    // 2) Imagens: costas e frente de cada cor
    await queryInterface.bulkInsert(
      "product_images",
      produtos.flatMap((p) =>
        p.images.map((file) => ({ product_id: p.id, enabled: true, path: `media/produtos/${file}` }))
      )
    );

    // 3) Opções: Tamanho e Cor (a cor principal da peça vem primeiro)
    await queryInterface.bulkInsert(
      "product_options",
      produtos.flatMap((p) => [
        { product_id: p.id, ...TAMANHOS },
        { product_id: p.id, ...CORES[p.cor_principal] },
      ])
    );

    // 4) Ligações produto <-> categoria (tabela intermediária)
    await queryInterface.bulkInsert(
      "product_categories",
      produtos.flatMap((p) => p.category_ids.map((categoryId) => ({ product_id: p.id, category_id: categoryId })))
    );
  },

  async down(queryInterface) {
    // Apagar o produto apaga imagens, opções e ligações (CASCADE)
    await queryInterface.bulkDelete("products", { id: produtos.map((p) => p.id) });
  },
};
