/**
 * SERVICE DE CATEGORIAS.
 * Mesma ideia do UserService: validação e acesso ao banco ficam aqui.
 */
const { Op } = require("sequelize");
const { Category } = require("../models");
const AppError = require("../utils/AppError");
const { isNonEmptyString, isSlug, isBoolean } = require("../utils/validators");
const { parsePagination, parseFields, pickFields, parseBooleanParam } = require("../utils/query");

const FIELDS = ["id", "name", "slug", "use_in_menu"];

function toPublic(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    use_in_menu: Boolean(category.use_in_menu), // o MySQL devolve 0/1; viramos true/false
  };
}

async function findOrFail(id) {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError(404, "Categoria não encontrada");
  return category;
}

/**
 * Valida os campos de uma categoria.
 * partial=false (cadastro): name e slug são obrigatórios.
 * partial=true (atualização): só valida o que veio.
 */
function validate(data, { partial }) {
  const errors = [];
  const values = {};

  if (data.name !== undefined || !partial) {
    if (isNonEmptyString(data.name)) values.name = data.name.trim();
    else errors.push("name é obrigatório");
  }
  if (data.slug !== undefined || !partial) {
    if (isSlug(data.slug)) values.slug = data.slug;
    else errors.push("slug é obrigatório e só aceita letras minúsculas, números e hífens (ex.: dragon-ball)");
  }
  if (data.use_in_menu !== undefined) {
    if (isBoolean(data.use_in_menu)) values.use_in_menu = data.use_in_menu;
    else errors.push("use_in_menu deve ser true ou false");
  }

  if (errors.length) throw new AppError(400, "Dados da categoria inválidos", errors);
  if (partial && !Object.keys(values).length) {
    throw new AppError(400, "Envie ao menos um campo: name, slug ou use_in_menu");
  }
  return values;
}

/** Garante que o slug ainda não está em uso (ignorando a própria categoria). */
async function ensureUniqueSlug(slug, ignoreId) {
  const where = { slug };
  if (ignoreId) where.id = { [Op.ne]: ignoreId }; // Op.ne = "diferente de"
  if (await Category.findOne({ where })) {
    throw new AppError(400, `Já existe uma categoria com o slug '${slug}'`);
  }
}

/** GET /v1/category/search */
async function search(query = {}) {
  const { limit, page, offset } = parsePagination(query);
  const fields = parseFields(query.fields, FIELDS);
  const useInMenu = parseBooleanParam(query.use_in_menu, "use_in_menu");

  const where = {};
  if (useInMenu !== undefined) where.use_in_menu = useInMenu;

  // findAndCountAll devolve a página pedida (rows) E o total geral (count),
  // que o front usa para montar a paginação.
  const options = { where, order: [["id", "ASC"]] };
  if (limit !== -1) Object.assign(options, { limit, offset });

  const { rows, count } = await Category.findAndCountAll(options);
  return {
    data: rows.map((c) => pickFields(toPublic(c), fields)),
    total: count,
    limit,
    page,
  };
}

/** GET /v1/category/:id */
async function getById(id) {
  return toPublic(await findOrFail(id));
}

/** POST /v1/category */
async function create(data = {}) {
  const values = validate(data, { partial: false });
  await ensureUniqueSlug(values.slug);
  const category = await Category.create(values);
  return toPublic(category);
}

/** PUT /v1/category/:id */
async function update(id, data = {}) {
  const category = await findOrFail(id);
  const values = validate(data, { partial: true });
  if (values.slug) await ensureUniqueSlug(values.slug, category.id);
  await category.update(values);
}

/** DELETE /v1/category/:id */
async function remove(id) {
  const category = await findOrFail(id);
  // As ligações com produtos (product_categories) somem pelo CASCADE.
  // Os produtos continuam existindo.
  await category.destroy();
}

module.exports = { search, getById, create, update, remove };
