/** TESTES DE ROTA para /v1/category (mesma técnica de user.test.js). */
jest.mock("../../src/services/CategoryService", () => ({
  search: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}));
jest.mock("../../src/services/UserService", () => ({}));
jest.mock("../../src/services/ProductService", () => ({}));

const request = require("supertest");
const app = require("../../src/app");
const CategoryService = require("../../src/services/CategoryService");
const AppError = require("../../src/utils/AppError");
const { tokenFor } = require("../helpers");

const auth = () => ({ Authorization: `Bearer ${tokenFor()}` });

beforeEach(() => jest.clearAllMocks());

describe("GET /v1/category/search", () => {
  test("200 com data, total, limit e page, repassando a query", async () => {
    const body = { data: [{ id: 1, name: "Dragon Ball", slug: "dragon-ball", use_in_menu: true }], total: 1, limit: -1, page: 1 };
    CategoryService.search.mockResolvedValue(body);
    const res = await request(app).get("/v1/category/search?limit=-1&use_in_menu=true");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(body);
    expect(CategoryService.search).toHaveBeenCalledWith({ limit: "-1", use_in_menu: "true" });
  });

  test("400 quando o service recusa os parâmetros", async () => {
    CategoryService.search.mockRejectedValue(new AppError(400, "limit inválido"));
    const res = await request(app).get("/v1/category/search?limit=0");
    expect(res.status).toBe(400);
  });
});

describe("GET /v1/category/:id", () => {
  test("200 quando existe", async () => {
    CategoryService.getById.mockResolvedValue({ id: 2, name: "One Piece", slug: "one-piece", use_in_menu: true });
    const res = await request(app).get("/v1/category/2");
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("one-piece");
  });

  test("404 quando não existe", async () => {
    CategoryService.getById.mockRejectedValue(new AppError(404, "Categoria não encontrada"));
    expect((await request(app).get("/v1/category/999")).status).toBe(404);
  });
});

describe("POST, PUT e DELETE /v1/category", () => {
  test("400 sem token", async () => {
    const res = await request(app).post("/v1/category").send({ name: "X", slug: "x" });
    expect(res.status).toBe(400);
    expect(CategoryService.create).not.toHaveBeenCalled();
  });

  test("201 ao criar", async () => {
    CategoryService.create.mockResolvedValue({ id: 8, name: "Bleach", slug: "bleach", use_in_menu: true });
    const res = await request(app).post("/v1/category").set(auth()).send({ name: "Bleach", slug: "bleach", use_in_menu: true });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(8);
  });

  test("204 ao atualizar", async () => {
    CategoryService.update.mockResolvedValue();
    const res = await request(app).put("/v1/category/8").set(auth()).send({ name: "Bleach TYBW" });
    expect(res.status).toBe(204);
    expect(CategoryService.update).toHaveBeenCalledWith(8, { name: "Bleach TYBW" });
  });

  test("404 ao excluir uma categoria que não existe", async () => {
    CategoryService.remove.mockRejectedValue(new AppError(404, "Categoria não encontrada"));
    const res = await request(app).delete("/v1/category/999").set(auth());
    expect(res.status).toBe(404);
  });
});
