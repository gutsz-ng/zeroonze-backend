/**
 * Testa o middleware de autenticação chamando-o direto, com objetos
 * "falsos" de req e next. jest.fn() cria uma função espiã: ela grava
 * com quais argumentos foi chamada, para conferirmos depois.
 */
const auth = require("../../src/middleware/auth");
const { tokenFor } = require("../helpers");

function run(headers) {
  const req = { headers };
  const next = jest.fn();
  auth(req, {}, next);
  return { req, error: next.mock.calls[0][0] };
}

describe("middleware auth", () => {
  test("sem cabeçalho Authorization: erro 400", () => {
    expect(run({}).error.status).toBe(400);
  });

  test("cabeçalho sem 'Bearer': erro 400", () => {
    expect(run({ authorization: "Token abc" }).error.status).toBe(400);
  });

  test("token inválido: erro 401", () => {
    expect(run({ authorization: "Bearer token.falso.123" }).error.status).toBe(401);
  });

  test("token válido: passa e guarda o usuário em req.user", () => {
    const { req, error } = run({ authorization: `Bearer ${tokenFor({ id: 7, email: "a@b.com" })}` });
    expect(error).toBeUndefined();
    expect(req.user).toEqual({ id: 7, email: "a@b.com" });
  });
});
