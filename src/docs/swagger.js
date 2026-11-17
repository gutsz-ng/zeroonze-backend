/**
 * DOCUMENTAÇÃO DA API no padrão OpenAPI 3 (o "Swagger").
 *
 * O pacote swagger-ui-express transforma este objeto numa página em
 * http://localhost:3000/docs, onde dá para ler cada rota e testá-la
 * pelo botão "Try it out", sem precisar de outro programa.
 *
 * Para testar rotas protegidas: faça login em POST /v1/user/token,
 * copie o token, clique em "Authorize" (cadeado) e cole.
 */

// Pequenos atalhos para não repetir o mesmo texto em toda rota
const json = (schema) => ({ "application/json": { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const erro = (description) => ({ description, content: json(ref("Error")) });
const idParam = { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } };
const R = {
  400: erro("Dados da requisição incorretos (ou cabeçalho Authorization ausente)"),
  401: erro("Token inválido ou expirado"),
  403: erro("Sem permissão para alterar este recurso"),
  404: erro("Recurso não encontrado"),
};
const protegida = [{ bearerAuth: [] }];
const paginacao = [
  { name: "limit", in: "query", schema: { type: "integer", default: 12 }, description: "Itens por página. Use -1 para buscar todos." },
  { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Página. Ignorado quando limit=-1." },
];

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "ZeroOnze API",
    version: "1.0.0",
    description:
      "API REST da loja ZeroOnze Geek Streetwear: usuários, categorias e produtos (camisetas oversized de anime).",
  },
  servers: [{ url: "http://localhost:3000", description: "Local" }],
  tags: [
    { name: "Usuários" },
    { name: "Categorias" },
    { name: "Produtos" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Produto não encontrado" },
          details: { type: "array", items: { type: "string" } },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          firstname: { type: "string", example: "Gustavo" },
          surname: { type: "string", example: "Nogueira" },
          email: { type: "string", example: "gustavo@zeroonze.com" },
        },
      },
      UserCreate: {
        type: "object",
        required: ["firstname", "surname", "email", "password", "confirmPassword"],
        properties: {
          firstname: { type: "string", example: "Gustavo" },
          surname: { type: "string", example: "Nogueira" },
          email: { type: "string", example: "gustavo@zeroonze.com" },
          password: { type: "string", example: "123@123" },
          confirmPassword: { type: "string", example: "123@123" },
        },
      },
      UserUpdate: {
        type: "object",
        properties: {
          firstname: { type: "string", example: "Gustavo" },
          surname: { type: "string", example: "Nogueira" },
          email: { type: "string", example: "gustavo@zeroonze.com" },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@zeroonze.com" },
          password: { type: "string", example: "123@123" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Dragon Ball" },
          slug: { type: "string", example: "dragon-ball" },
          use_in_menu: { type: "boolean", example: true },
        },
      },
      CategoryInput: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string", example: "Demon Slayer" },
          slug: { type: "string", example: "demon-slayer" },
          use_in_menu: { type: "boolean", example: true },
        },
      },
      Option: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Tamanho" },
          shape: { type: "string", enum: ["square", "circle"] },
          radius: { type: "integer", example: 4 },
          type: { type: "string", enum: ["text", "color"] },
          values: { type: "array", items: { type: "string" }, example: ["P", "M", "G", "GG"] },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          enabled: { type: "boolean", example: true },
          name: { type: "string", example: "Oversized Zoro" },
          slug: { type: "string", example: "zoro" },
          stock: { type: "integer", example: 50 },
          description: { type: "string" },
          price: { type: "number", example: 89.8 },
          price_with_discount: { type: "number", example: 89.8 },
          category_ids: { type: "array", items: { type: "integer" }, example: [2, 6] },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                content: { type: "string", example: "http://localhost:3000/media/produtos/zoro.jpg" },
              },
            },
          },
          options: { type: "array", items: ref("Option") },
        },
      },
      ProductInput: {
        type: "object",
        required: ["name", "slug", "price", "price_with_discount"],
        properties: {
          enabled: { type: "boolean", example: true },
          name: { type: "string", example: "Oversized Tanjiro" },
          slug: { type: "string", example: "tanjiro" },
          stock: { type: "integer", example: 10 },
          description: { type: "string", example: "Respiração da Água, Primeira Forma." },
          price: { type: "number", example: 99.9 },
          price_with_discount: { type: "number", example: 89.9 },
          category_ids: { type: "array", items: { type: "integer" }, example: [1] },
          images: {
            type: "array",
            description:
              "Cadastro: { type, content(base64) }. Atualização: também { id, deleted: true } para apagar e { id, content } para trocar.",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                deleted: { type: "boolean" },
                type: { type: "string", example: "image/png" },
                content: { type: "string", example: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" },
              },
            },
          },
          options: {
            type: "array",
            description: "Na atualização: { id, deleted: true } apaga; { id, ...campos } altera; sem id cria.",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                deleted: { type: "boolean" },
                title: { type: "string", example: "Tamanho" },
                shape: { type: "string", enum: ["square", "circle"] },
                radius: { oneOf: [{ type: "integer" }, { type: "string" }], example: "4px" },
                type: { type: "string", enum: ["text", "color"] },
                values: { type: "array", items: { type: "string" }, example: ["P", "M", "G", "GG"] },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    // ------------------------------------------------------------- Usuários
    "/v1/user/{id}": {
      get: {
        tags: ["Usuários"],
        summary: "Obter usuário pelo ID",
        parameters: [idParam],
        responses: { 200: { description: "OK", content: json(ref("User")) }, 404: R[404] },
      },
      put: {
        tags: ["Usuários"],
        summary: "Atualizar usuário (só a própria conta)",
        security: protegida,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("UserUpdate")) },
        responses: { 204: { description: "Atualizado" }, 400: R[400], 401: R[401], 403: R[403], 404: R[404] },
      },
      delete: {
        tags: ["Usuários"],
        summary: "Excluir usuário (só a própria conta)",
        security: protegida,
        parameters: [idParam],
        responses: { 204: { description: "Excluído" }, 400: R[400], 401: R[401], 403: R[403], 404: R[404] },
      },
    },
    "/v1/user": {
      post: {
        tags: ["Usuários"],
        summary: "Cadastrar usuário",
        requestBody: { required: true, content: json(ref("UserCreate")) },
        responses: { 201: { description: "Criado", content: json(ref("User")) }, 400: R[400] },
      },
    },
    "/v1/user/token": {
      post: {
        tags: ["Usuários"],
        summary: "Gerar token JWT (login)",
        requestBody: { required: true, content: json(ref("Login")) },
        responses: {
          200: {
            description: "OK",
            content: json({ type: "object", properties: { token: { type: "string" } } }),
          },
          400: R[400],
        },
      },
    },

    // ----------------------------------------------------------- Categorias
    "/v1/category/search": {
      get: {
        tags: ["Categorias"],
        summary: "Listar categorias",
        parameters: [
          ...paginacao,
          { name: "fields", in: "query", schema: { type: "string" }, example: "name,slug" },
          { name: "use_in_menu", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: {
            description: "OK",
            content: json({
              type: "object",
              properties: {
                data: { type: "array", items: ref("Category") },
                total: { type: "integer" },
                limit: { type: "integer" },
                page: { type: "integer" },
              },
            }),
          },
          400: R[400],
        },
      },
    },
    "/v1/category/{id}": {
      get: {
        tags: ["Categorias"],
        summary: "Obter categoria pelo ID",
        parameters: [idParam],
        responses: { 200: { description: "OK", content: json(ref("Category")) }, 404: R[404] },
      },
      put: {
        tags: ["Categorias"],
        summary: "Atualizar categoria",
        security: protegida,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("CategoryInput")) },
        responses: { 204: { description: "Atualizada" }, 400: R[400], 401: R[401], 404: R[404] },
      },
      delete: {
        tags: ["Categorias"],
        summary: "Excluir categoria",
        security: protegida,
        parameters: [idParam],
        responses: { 204: { description: "Excluída" }, 400: R[400], 401: R[401], 404: R[404] },
      },
    },
    "/v1/category": {
      post: {
        tags: ["Categorias"],
        summary: "Cadastrar categoria",
        security: protegida,
        requestBody: { required: true, content: json(ref("CategoryInput")) },
        responses: { 201: { description: "Criada", content: json(ref("Category")) }, 400: R[400], 401: R[401] },
      },
    },

    // ------------------------------------------------------------- Produtos
    "/v1/product/search": {
      get: {
        tags: ["Produtos"],
        summary: "Listar produtos com filtros",
        parameters: [
          ...paginacao,
          { name: "fields", in: "query", schema: { type: "string" }, example: "name,images,price" },
          { name: "match", in: "query", schema: { type: "string" }, description: "Procura no nome ou na descrição", example: "Kakaroto" },
          { name: "category_ids", in: "query", schema: { type: "string" }, example: "1,3" },
          { name: "price-range", in: "query", schema: { type: "string" }, example: "80-100" },
          {
            name: "option[1]",
            in: "query",
            schema: { type: "string" },
            description: "Filtra pelo valor de uma opção. Troque 1 pelo id da opção.",
            example: "GG,P",
          },
        ],
        responses: {
          200: {
            description: "OK",
            content: json({
              type: "object",
              properties: {
                data: { type: "array", items: ref("Product") },
                total: { type: "integer" },
                limit: { type: "integer" },
                page: { type: "integer" },
              },
            }),
          },
          400: R[400],
        },
      },
    },
    "/v1/product/{id}": {
      get: {
        tags: ["Produtos"],
        summary: "Obter produto pelo ID",
        parameters: [idParam],
        responses: { 200: { description: "OK", content: json(ref("Product")) }, 404: R[404] },
      },
      put: {
        tags: ["Produtos"],
        summary: "Atualizar produto",
        security: protegida,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("ProductInput")) },
        responses: { 204: { description: "Atualizado" }, 400: R[400], 401: R[401], 404: R[404] },
      },
      delete: {
        tags: ["Produtos"],
        summary: "Excluir produto",
        security: protegida,
        parameters: [idParam],
        responses: { 204: { description: "Excluído" }, 400: R[400], 401: R[401], 404: R[404] },
      },
    },
    "/v1/product": {
      post: {
        tags: ["Produtos"],
        summary: "Cadastrar produto",
        security: protegida,
        requestBody: { required: true, content: json(ref("ProductInput")) },
        responses: { 201: { description: "Criado", content: json(ref("Product")) }, 400: R[400], 401: R[401] },
      },
    },
  },
};
