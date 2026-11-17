/**
 * TESTES UNITÁRIOS: testam uma função sozinha, sem banco e sem HTTP.
 *
 * Estrutura de um teste no Jest:
 *   describe("grupo", () => {
 *     test("o que deve acontecer", () => {
 *       expect(valorReal).toBe(valorEsperado);
 *     });
 *   });
 * Rode com: npm test
 */
const q = require("../../src/utils/query");
const AppError = require("../../src/utils/AppError");

describe("parsePagination", () => {
  test("usa limit 12 e page 1 quando nada é enviado", () => {
    expect(q.parsePagination({})).toEqual({ limit: 12, page: 1, offset: 0 });
  });

  test("calcula o offset da página", () => {
    expect(q.parsePagination({ limit: "10", page: "3" })).toEqual({ limit: 10, page: 3, offset: 20 });
  });

  test("limit=-1 busca tudo e ignora a página", () => {
    expect(q.parsePagination({ limit: "-1", page: "5" })).toEqual({ limit: -1, page: 1, offset: 0 });
  });

  test.each([["0"], ["-2"], ["abc"], ["1.5"]])("recusa limit=%s com erro 400", (limit) => {
    expect(() => q.parsePagination({ limit })).toThrow(AppError);
  });

  test("recusa page=0", () => {
    expect(() => q.parsePagination({ page: "0" })).toThrow("page");
  });
});

describe("parseFields e pickFields", () => {
  const allowed = ["id", "name", "slug"];

  test("devolve null quando fields não foi enviado", () => {
    expect(q.parseFields(undefined, allowed)).toBeNull();
  });

  test("separa os campos por vírgula", () => {
    expect(q.parseFields("name, slug", allowed)).toEqual(["name", "slug"]);
  });

  test("recusa campo que não existe", () => {
    expect(() => q.parseFields("name,senha", allowed)).toThrow("senha");
  });

  test("pickFields mantém só os campos pedidos", () => {
    expect(q.pickFields({ id: 1, name: "A", slug: "a" }, ["name"])).toEqual({ name: "A" });
  });
});

describe("filtros de produto", () => {
  test("price-range aceita inteiros e decimais", () => {
    expect(q.parsePriceRange("100-200")).toEqual({ min: 100, max: 200 });
    expect(q.parsePriceRange("89.9-109.9")).toEqual({ min: 89.9, max: 109.9 });
  });

  test("price-range recusa formato errado e mínimo maior que máximo", () => {
    expect(() => q.parsePriceRange("100")).toThrow(AppError);
    expect(() => q.parsePriceRange("200-100")).toThrow(AppError);
  });

  test("category_ids vira lista de números", () => {
    expect(q.parseIdList("15,24", "category_ids")).toEqual([15, 24]);
    expect(() => q.parseIdList("15,x", "category_ids")).toThrow(AppError);
  });

  test("option[45]=GG,PP vira { 45: ['GG', 'PP'] }", () => {
    // formato que o Express entrega com o parser "simple" (app.js)
    expect(q.parseOptionFilters({ "option[45]": "GG,PP" })).toEqual({ 45: ["GG", "PP"] });
    // formato de objeto, caso o parser seja trocado
    expect(q.parseOptionFilters({ option: { 7: "P" } })).toEqual({ 7: ["P"] });
    expect(q.parseOptionFilters({})).toBeUndefined();
  });

  test("use_in_menu aceita true/false e recusa outros textos", () => {
    expect(q.parseBooleanParam("true", "use_in_menu")).toBe(true);
    expect(q.parseBooleanParam("0", "use_in_menu")).toBe(false);
    expect(() => q.parseBooleanParam("talvez", "use_in_menu")).toThrow(AppError);
  });
});
