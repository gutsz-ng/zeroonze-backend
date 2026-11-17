/**
 * TESTES DE ROTA (integração do Express) para /v1/user.
 *
 * O supertest faz requisições HTTP de verdade no app, sem abrir porta.
 * Os SERVICES são substituídos por "mocks" (jest.mock): funções falsas
 * que devolvem o que mandarmos. Assim testamos rotas, middlewares,
 * controllers e status HTTP SEM precisar do MySQL ligado.
 */
jest.mock("../../src/services/UserService", () => ({
  getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), generateToken: jest.fn(),
}));
jest.mock("../../src/services/CategoryService", () => ({}));
jest.mock("../../src/services/ProductService", () => ({}));

const request = require("supertest");
const app = require("../../src/app");
const UserService = require("../../src/services/UserService");
const AppError = require("../../src/utils/AppError");
const { tokenFor } = require("../helpers");

beforeEach(() => jest.clearAllMocks()); // zera os mocks entre um teste e outro

describe("GET /v1/user/:id", () => {
  test("200 com os dados do usuário", async () => {
    UserService.getById.mockResolvedValue({ id: 1, firstname: "Ana", surname: "Lima", email: "ana@mail.com" });
    const res = await request(app).get("/v1/user/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, firstname: "Ana", surname: "Lima", email: "ana@mail.com" });
    expect(res.body.password).toBeUndefined();
  });

  test("404 quando o usuário não existe", async () => {
    UserService.getById.mockRejectedValue(new AppError(404, "Usuário não encontrado"));
    const res = await request(app).get("/v1/user/99");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Usuário não encontrado");
  });

  test("400 quando o id não é número", async () => {
    const res = await request(app).get("/v1/user/abc");
    expect(res.status).toBe(400);
    expect(UserService.getById).not.toHaveBeenCalled();
  });
});

describe("POST /v1/user", () => {
  test("201 ao cadastrar (não precisa de token)", async () => {
    UserService.create.mockResolvedValue({ id: 2, firstname: "Ana", surname: "Lima", email: "ana@mail.com" });
    const res = await request(app).post("/v1/user").send({
      firstname: "Ana", surname: "Lima", email: "ana@mail.com", password: "123@123", confirmPassword: "123@123",
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(2);
  });

  test("400 com dados inválidos", async () => {
    UserService.create.mockRejectedValue(new AppError(400, "Dados de cadastro inválidos", ["email deve ser um e-mail válido"]));
    const res = await request(app).post("/v1/user").send({ email: "errado" });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain("email deve ser um e-mail válido");
  });

  test("400 quando o JSON está mal escrito", async () => {
    const res = await request(app).post("/v1/user").set("Content-Type", "application/json").send('{"email": ');
    expect(res.status).toBe(400);
  });
});

describe("POST /v1/user/token", () => {
  test("200 com o token", async () => {
    UserService.generateToken.mockResolvedValue({ token: "abc" });
    const res = await request(app).post("/v1/user/token").send({ email: "a@b.com", password: "123@123" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: "abc" });
  });
});

describe("PUT e DELETE /v1/user/:id", () => {
  test("400 sem o cabeçalho Authorization", async () => {
    const res = await request(app).put("/v1/user/1").send({ firstname: "Novo" });
    expect(res.status).toBe(400);
    expect(UserService.update).not.toHaveBeenCalled();
  });

  test("401 com token inválido", async () => {
    const res = await request(app).delete("/v1/user/1").set("Authorization", "Bearer invalido");
    expect(res.status).toBe(401);
  });

  test("204 ao atualizar com token válido, repassando quem está logado", async () => {
    UserService.update.mockResolvedValue();
    const res = await request(app)
      .put("/v1/user/1")
      .set("Authorization", `Bearer ${tokenFor({ id: 1, email: "admin@zeroonze.com" })}`)
      .send({ firstname: "Novo" });
    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(UserService.update).toHaveBeenCalledWith(1, { firstname: "Novo" }, { id: 1, email: "admin@zeroonze.com" });
  });

  test("204 ao excluir com token válido", async () => {
    UserService.remove.mockResolvedValue();
    const res = await request(app).delete("/v1/user/1").set("Authorization", `Bearer ${tokenFor()}`);
    expect(res.status).toBe(204);
  });
});

describe("rotas inexistentes", () => {
  test("404 em uma URL que não existe", async () => {
    const res = await request(app).get("/v1/nada");
    expect(res.status).toBe(404);
  });
});
