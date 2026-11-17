/**
 * Leitura dos parâmetros de busca (query string).
 *
 * Query string é a parte da URL depois do "?":
 *   /v1/product/search?limit=12&page=2&match=goku
 * O Express entrega isso em req.query como TEXTO:
 *   { limit: "12", page: "2", match: "goku" }
 * Aqui convertemos e validamos. Se algo vier errado, lançamos
 * AppError(400), que é o "Bad Request" pedido nos requisitos.
 */
const AppError = require("./AppError");

const DEFAULT_LIMIT = 12;
const DEFAULT_PAGE = 1;

/** Converte "12" em 12, mas só se for um inteiro de verdade. */
function toInteger(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : NaN;
  if (typeof value !== "string" || !/^-?\d+$/.test(value.trim())) return NaN;
  return Number(value);
}

/**
 * limit e page.
 * - limit=-1 significa "todos os itens" (sem paginação)
 * - offset é quantos itens pular: página 3 com limit 12 pula 24
 */
function parsePagination(query = {}) {
  const limit = query.limit === undefined ? DEFAULT_LIMIT : toInteger(query.limit);
  const page = query.page === undefined ? DEFAULT_PAGE : toInteger(query.page);

  if (Number.isNaN(limit) || (limit !== -1 && limit < 1)) {
    throw new AppError(400, "O parâmetro 'limit' deve ser um inteiro maior que 0, ou -1 para buscar tudo");
  }
  if (Number.isNaN(page) || page < 1) {
    throw new AppError(400, "O parâmetro 'page' deve ser um inteiro maior que 0");
  }

  // Com limit=-1 a página não tem efeito: devolvemos sempre a página 1
  if (limit === -1) return { limit, page: 1, offset: 0 };
  return { limit, page, offset: (page - 1) * limit };
}

/**
 * fields=name,slug -> ["name", "slug"]
 * Só aceita campos que existem na lista "allowed".
 * Devolve null quando o parâmetro não foi enviado (= todos os campos).
 */
function parseFields(value, allowed) {
  if (value === undefined || value === "") return null;
  if (typeof value !== "string") throw new AppError(400, "O parâmetro 'fields' deve ser um texto separado por vírgulas");

  const fields = value.split(",").map((f) => f.trim()).filter(Boolean);
  const invalid = fields.filter((f) => !allowed.includes(f));
  if (invalid.length) {
    throw new AppError(400, `Campos inválidos em 'fields': ${invalid.join(", ")}`, [
      `Campos permitidos: ${allowed.join(", ")}`,
    ]);
  }
  return fields;
}

/** Monta um novo objeto só com os campos pedidos. */
function pickFields(obj, fields) {
  if (!fields) return obj;
  return fields.reduce((acc, field) => {
    acc[field] = obj[field];
    return acc;
  }, {});
}

/** "true"/"1" -> true, "false"/"0" -> false. Outro valor é erro 400. */
function parseBooleanParam(value, name) {
  if (value === undefined) return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  throw new AppError(400, `O parâmetro '${name}' deve ser true ou false`);
}

/** "15,24" -> [15, 24] */
function parseIdList(value, name) {
  if (value === undefined || value === "") return undefined;
  const ids = String(value).split(",").map((v) => toInteger(v));
  if (ids.some((id) => Number.isNaN(id) || id < 1)) {
    throw new AppError(400, `O parâmetro '${name}' deve ser uma lista de ids separados por vírgula`);
  }
  return ids;
}

/** "100-200" -> { min: 100, max: 200 }. Aceita decimais: "89.9-109.9" */
function parsePriceRange(value) {
  if (value === undefined || value === "") return undefined;
  const match = /^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/.exec(String(value));
  if (!match) throw new AppError(400, "O parâmetro 'price-range' deve ter o formato min-max, ex.: 100-200");
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (min > max) throw new AppError(400, "Em 'price-range', o mínimo não pode ser maior que o máximo");
  return { min, max };
}

/**
 * option[45]=GG,PP -> { 45: ["GG", "PP"] }
 *
 * Com o parser "simple" (configurado em app.js), o Express entrega a chave
 * literal: { "option[45]": "GG,PP" }. Também aceitamos o formato de objeto
 * { option: { 45: "GG,PP" } }, caso o parser seja trocado um dia.
 */
function parseOptionFilters(query = {}) {
  const raw = {};
  if (query.option && typeof query.option === "object") Object.assign(raw, query.option);
  for (const [key, value] of Object.entries(query)) {
    const m = /^option\[(\d+)\]$/.exec(key);
    if (m) raw[m[1]] = value;
  }

  const filters = {};
  for (const [id, value] of Object.entries(raw)) {
    const optionId = toInteger(id);
    if (Number.isNaN(optionId) || optionId < 1) {
      throw new AppError(400, "O filtro 'option' deve usar o id da opção, ex.: option[45]=GG,PP");
    }
    const values = String(value).split(",").map((v) => v.trim()).filter(Boolean);
    if (!values.length) throw new AppError(400, `Informe ao menos um valor em option[${optionId}]`);
    filters[optionId] = values;
  }
  return Object.keys(filters).length ? filters : undefined;
}

module.exports = {
  DEFAULT_LIMIT,
  toInteger,
  parsePagination,
  parseFields,
  pickFields,
  parseBooleanParam,
  parseIdList,
  parsePriceRange,
  parseOptionFilters,
};
