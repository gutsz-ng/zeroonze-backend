/** TESTES DE ROTA para /v1/product (mesma técnica de user.test.js). */
jest.mock("../../src/services/ProductService", () => ({
  search: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}));
jest.mock("../../src/services/UserService", () => ({}));
jest.mock("../../src/services/CategoryService", () => ({}));

const request = require("supertest");
const app = require("../../src/app");
const ProductService = require("../../src/services/ProductService");
const AppError = require("../../src/utils/AppError");
const { tokenFor } = require("../helpers");

const auth = () => ({ Authorization: `Bearer ${tokenFor()}` });

beforeEach(() => jest.clearAllMocks());

describe("GET /v1/product/search", () => {
  test("200 e repassa os filtros (incluindo option[id]) para o service", async () => {
    ProductService.search.mockResolvedValue({ data: [], total: 0, limit: 12, page: 1 });
    const res = await request(app).get("/v1/product/search?match=goku&category_ids=1,7&price-range=80-120&option[1]=GG,P");
    expect(res.status).toBe(200);
    expect(ProductService.search).toHaveBeenCalledWith({
      match: "goku",
      category_ids: "1,7",
      "price-range": "80-120",
      "option[1]": "GG,P",
    });
  });
});

describe("GET /v1/product/:id", () => {
  test("200 com o produto", async () => {
    ProductService.getById.mockResolvedValue({ id: 1, name: "Oversized Zoro", category_ids: [2, 6], images: [], options: [] });
    const res = await request(app).get("/v1/product/1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Oversized Zoro");
  });

  test("404 quando não existe", async () => {
    ProductService.getById.mockRejectedValue(new AppError(404, "Produto não encontrado"));
    expect((await request(app).get("/v1/product/999")).status).toBe(404);
  });
});

describe("POST, PUT e DELETE /v1/product", () => {
  const novo = { name: "Oversized Tanjiro", slug: "tanjiro", price: 99.9, price_with_discount: 89.9 };

  test("400 sem token", async () => {
    expect((await request(app).post("/v1/product").send(novo)).status).toBe(400);
    expect(ProductService.create).not.toHaveBeenCalled();
  });

  test("401 com token inválido", async () => {
    const res = await request(app).put("/v1/product/1").set("Authorization", "Bearer x.y.z").send(novo);
    expect(res.status).toBe(401);
  });

  test("201 ao criar", async () => {
    ProductService.create.mockResolvedValue({ id: 17, ...novo });
    const res = await request(app).post("/v1/product").set(auth()).send(novo);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(17);
  });

  test("400 quando o service encontra dados inválidos", async () => {
    ProductService.create.mockRejectedValue(new AppError(400, "Dados do produto inválidos", ["price é obrigatório"]));
    const res = await request(app).post("/v1/product").set(auth()).send({ name: "Sem preço" });
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(["price é obrigatório"]);
  });

  test("204 ao atualizar e ao excluir", async () => {
    ProductService.update.mockResolvedValue();
    ProductService.remove.mockResolvedValue();
    expect((await request(app).put("/v1/product/1").set(auth()).send({ stock: 5 })).status).toBe(204);
    expect((await request(app).delete("/v1/product/1").set(auth())).status).toBe(204);
  });
});
