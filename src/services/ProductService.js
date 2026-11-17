/**
 * SERVICE DE PRODUTOS. É o maior da API, porque um produto tem
 * relacionamentos: imagens (1:N), opções (1:N) e categorias (N:N).
 */
const { Op } = require("sequelize");
const {
  sequelize,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
  Category,
} = require("../models");
const AppError = require("../utils/AppError");
const ImageService = require("./ImageService");
const { baseUrl } = require("../config/env");
const v = require("../utils/validators");
const {
  parsePagination,
  parseFields,
  pickFields,
  parseIdList,
  parsePriceRange,
  parseOptionFilters,
} = require("../utils/query");

const FIELDS = [
  "id",
  "enabled",
  "name",
  "slug",
  "stock",
  "description",
  "price",
  "price_with_discount",
  "category_ids",
  "images",
  "options",
];

/**
 * "include" diz ao Sequelize para trazer os relacionamentos junto,
 * numa consulta só (com JOIN), em vez de uma consulta por produto.
 * Isso evita o famoso problema "N+1": 12 produtos = 1 consulta, não 13.
 */
const INCLUDE = [
  { model: ProductImage, as: "images", attributes: ["id", "path", "enabled"] },
  { model: ProductOption, as: "options" },
  {
    model: Category,
    as: "categories",
    attributes: ["id"],
    through: { attributes: [] }, // não precisamos das colunas da tabela intermediária
  },
];

// ----------------------------------------------------------------------------
// Formatação da resposta
// ----------------------------------------------------------------------------

/** Caminho salvo no banco -> link completo da imagem. */
const imageUrl = (p) => (/^https?:\/\//.test(p) ? p : `${baseUrl}/${p}`);

/** Registro do banco -> formato pedido nos requisitos. */
function toPublic(product) {
  return {
    id: product.id,
    enabled: Boolean(product.enabled),
    name: product.name,
    slug: product.slug,
    stock: product.stock,
    description: product.description,
    price: product.price,
    price_with_discount: product.price_with_discount,
    category_ids: (product.categories || []).map((c) => c.id).sort((a, b) => a - b),
    images: (product.images || [])
      .filter((img) => img.enabled) // imagens desabilitadas não aparecem na loja
      .sort((a, b) => a.id - b.id)
      .map((img) => ({ id: img.id, content: imageUrl(img.path) })),
    options: (product.options || [])
      .sort((a, b) => a.id - b.id)
      .map((opt) => ({
        id: opt.id,
        title: opt.title,
        shape: opt.shape,
        radius: opt.radius,
        type: opt.type,
        // No banco é "P,M,G,GG"; na resposta devolvemos uma lista
        values: opt.values.split(","),
      })),
  };
}

async function findOrFail(id, transaction) {
  const product = await Product.findByPk(id, { include: INCLUDE, transaction });
  if (!product) throw new AppError(404, "Produto não encontrado");
  return product;
}

// ----------------------------------------------------------------------------
// Validação do corpo da requisição
// ----------------------------------------------------------------------------

/** "4px", "4" ou 4 -> 4 */
function parseRadius(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+(px)?$/.test(value.trim())) return parseInt(value, 10);
  return NaN;
}

/**
 * O requisito usa às vezes "value" e às vezes "values" para a lista de
 * opções. Aceitamos os dois nomes. Também aceitamos texto "P,M,G".
 */
function parseOptionValues(opt) {
  const raw = opt.values !== undefined ? opt.values : opt.value;
  if (raw === undefined) return undefined;
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : null;
  if (!list) return null;
  const clean = list.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  // Vírgula dentro de um valor quebraria o formato "P,M,G" salvo no banco
  if (!clean.length || clean.length !== list.length || clean.some((x) => x.includes(","))) return null;
  return clean;
}

/**
 * Valida uma opção e devolve só os campos que podem ir para o banco.
 * isNew=true exige title e values (opção nova).
 */
function validateOption(opt, index, isNew, errors) {
  const label = `options[${index}]`;
  const values = {};

  if (opt.title !== undefined || isNew) {
    if (v.isNonEmptyString(opt.title)) values.title = opt.title.trim();
    else errors.push(`${label}.title é obrigatório`);
  }
  if (opt.shape !== undefined) {
    if (["square", "circle"].includes(opt.shape)) values.shape = opt.shape;
    else errors.push(`${label}.shape deve ser "square" ou "circle"`);
  }
  if (opt.radius !== undefined) {
    const radius = parseRadius(opt.radius);
    if (Number.isNaN(radius)) errors.push(`${label}.radius deve ser um número, ex.: 4 ou "4px"`);
    else values.radius = radius;
  }
  if (opt.type !== undefined) {
    if (["text", "color"].includes(opt.type)) values.type = opt.type;
    else errors.push(`${label}.type deve ser "text" ou "color"`);
  }
  const list = parseOptionValues(opt);
  if (list === null || (list === undefined && isNew)) {
    errors.push(`${label}.values deve ser uma lista de textos, ex.: ["P", "M", "G"]`);
  } else if (list) {
    values.values = list.join(",");
  }
  return values;
}

/**
 * Valida o produto inteiro.
 * partial=false: cadastro (campos obrigatórios exigidos)
 * partial=true:  atualização (valida só o que veio)
 */
function validateProduct(data, { partial }) {
  const errors = [];
  const fields = {};
  const required = (key) => data[key] !== undefined || !partial;

  if (required("name")) {
    if (v.isNonEmptyString(data.name)) fields.name = data.name.trim();
    else errors.push("name é obrigatório");
  }
  if (required("slug")) {
    if (v.isSlug(data.slug)) fields.slug = data.slug;
    else errors.push("slug é obrigatório e só aceita letras minúsculas, números e hífens");
  }
  if (required("price")) {
    if (v.isNonNegativeNumber(data.price)) fields.price = data.price;
    else errors.push("price é obrigatório e deve ser um número maior ou igual a 0");
  }
  if (required("price_with_discount")) {
    if (v.isNonNegativeNumber(data.price_with_discount)) fields.price_with_discount = data.price_with_discount;
    else errors.push("price_with_discount é obrigatório e deve ser um número maior ou igual a 0");
  }
  for (const key of ["enabled", "use_in_menu"]) {
    if (data[key] === undefined) continue;
    if (v.isBoolean(data[key])) fields[key] = data[key];
    else errors.push(`${key} deve ser true ou false`);
  }
  if (data.stock !== undefined) {
    if (v.isNonNegativeInteger(data.stock)) fields.stock = data.stock;
    else errors.push("stock deve ser um número inteiro maior ou igual a 0");
  }
  if (data.description !== undefined) {
    if (data.description === null || typeof data.description === "string") fields.description = data.description;
    else errors.push("description deve ser um texto");
  }

  let categoryIds;
  if (data.category_ids !== undefined) {
    if (Array.isArray(data.category_ids) && data.category_ids.every(v.isPositiveInteger)) {
      categoryIds = [...new Set(data.category_ids)]; // remove ids repetidos
    } else {
      errors.push("category_ids deve ser uma lista de ids, ex.: [1, 2]");
    }
  }

  if (data.images !== undefined && !Array.isArray(data.images)) errors.push("images deve ser uma lista");
  if (data.options !== undefined && !Array.isArray(data.options)) errors.push("options deve ser uma lista");

  return { errors, fields, categoryIds };
}

/** Confere se todas as categorias informadas existem. */
async function ensureCategoriesExist(ids, transaction) {
  if (!ids || !ids.length) return;
  const found = await Category.findAll({ where: { id: ids }, attributes: ["id"], transaction });
  const foundIds = found.map((c) => c.id);
  const missing = ids.filter((id) => !foundIds.includes(id));
  if (missing.length) throw new AppError(400, `Categorias inexistentes: ${missing.join(", ")}`);
}

async function ensureUniqueSlug(slug, ignoreId, transaction) {
  const where = { slug };
  if (ignoreId) where.id = { [Op.ne]: ignoreId };
  if (await Product.findOne({ where, transaction })) {
    throw new AppError(400, `Já existe um produto com o slug '${slug}'`);
  }
}

// ----------------------------------------------------------------------------
// GET /v1/product/search
// ----------------------------------------------------------------------------

/** Interseção de dois conjuntos de ids (o que está nos dois). */
function intersect(current, next) {
  if (!current) return next;
  return new Set([...current].filter((id) => next.has(id)));
}

async function search(query = {}) {
  // 1) Lê e valida todos os parâmetros ANTES de ir ao banco
  const { limit, page, offset } = parsePagination(query);
  const fields = parseFields(query.fields, FIELDS);
  const categoryIds = parseIdList(query.category_ids, "category_ids");
  const priceRange = parsePriceRange(query["price-range"]);
  const optionFilters = parseOptionFilters(query);
  const match = typeof query.match === "string" ? query.match.trim() : undefined;

  // 2) Monta o WHERE com os filtros que são colunas do próprio produto
  const where = {};
  if (match) {
    // Op.like com % = "contém". Procura no nome OU na descrição.
    where[Op.or] = [
      { name: { [Op.like]: `%${match}%` } },
      { description: { [Op.like]: `%${match}%` } },
    ];
  }
  if (priceRange) where.price = { [Op.between]: [priceRange.min, priceRange.max] };

  // 3) Filtros que dependem de outras tabelas viram uma lista de ids
  //    de produtos permitidos. Vários filtros = interseção (precisa
  //    atender a TODOS).
  let allowedIds; // undefined = sem restrição

  if (categoryIds) {
    const links = await ProductCategory.findAll({
      where: { category_id: categoryIds },
      attributes: ["product_id"],
    });
    allowedIds = intersect(allowedIds, new Set(links.map((l) => l.product_id)));
  }

  if (optionFilters) {
    for (const [optionId, wanted] of Object.entries(optionFilters)) {
      const option = await ProductOption.findByPk(optionId, { attributes: ["product_id", "values"] });
      const has = option && option.values.split(",").some((value) => wanted.includes(value));
      allowedIds = intersect(allowedIds, new Set(has ? [option.product_id] : []));
    }
  }

  if (allowedIds) {
    if (!allowedIds.size) return { data: [], total: 0, limit, page };
    where.id = { [Op.in]: [...allowedIds] };
  }

  // 4) Busca a página pedida. distinct:true faz o total contar
  //    PRODUTOS, e não as linhas multiplicadas pelo JOIN das imagens.
  const options = { where, include: INCLUDE, distinct: true, order: [["id", "ASC"]] };
  if (limit !== -1) Object.assign(options, { limit, offset });

  const { rows, count } = await Product.findAndCountAll(options);
  return {
    data: rows.map((p) => pickFields(toPublic(p), fields)),
    total: count,
    limit,
    page,
  };
}

// ----------------------------------------------------------------------------
// GET /v1/product/:id
// ----------------------------------------------------------------------------

async function getById(id) {
  return toPublic(await findOrFail(id));
}

// ----------------------------------------------------------------------------
// POST /v1/product
// ----------------------------------------------------------------------------

async function create(data = {}) {
  const { errors, fields, categoryIds } = validateProduct(data, { partial: false });

  const images = data.images || [];
  images.forEach((img, i) => {
    if (!img || typeof img !== "object") return errors.push(`images[${i}] inválida`);
    if (!ImageService.isValidType(img.type)) errors.push(`images[${i}].type deve ser image/png, image/jpeg, image/webp ou image/gif`);
    if (!v.isNonEmptyString(img.content)) errors.push(`images[${i}].content deve ser o base64 da imagem`);
  });

  const options = (data.options || []).map((opt, i) =>
    opt && typeof opt === "object" ? validateOption(opt, i, true, errors) : errors.push(`options[${i}] inválida`)
  );

  if (errors.length) throw new AppError(400, "Dados do produto inválidos", errors);

  // Arquivos gravados nesta requisição. Se algo der errado, apagamos.
  const writtenFiles = [];

  try {
    /**
     * TRANSAÇÃO: ou TUDO é salvo (produto, opções, categorias, imagens),
     * ou NADA é. Se qualquer passo lançar erro, o Sequelize desfaz
     * (rollback) o que já tinha sido gravado no banco. Sem isso, um erro
     * na 3ª imagem deixaria um produto "pela metade".
     */
    const productId = await sequelize.transaction(async (transaction) => {
      await ensureUniqueSlug(fields.slug, null, transaction);
      await ensureCategoriesExist(categoryIds, transaction);

      const product = await Product.create(fields, { transaction });

      if (categoryIds) await product.setCategories(categoryIds, { transaction });

      for (const opt of options) {
        await ProductOption.create({ ...opt, product_id: product.id }, { transaction });
      }

      for (const img of images) {
        const filePath = await ImageService.save(product.id, img.type, img.content);
        writtenFiles.push(filePath);
        await ProductImage.create({ product_id: product.id, path: filePath, enabled: true }, { transaction });
      }

      return product.id;
    });

    return getById(productId);
  } catch (err) {
    await Promise.all(writtenFiles.map((f) => ImageService.remove(f)));
    throw err;
  }
}

// ----------------------------------------------------------------------------
// PUT /v1/product/:id
// ----------------------------------------------------------------------------

/**
 * Regras do requisito para "images" na atualização:
 *  { type, content }          -> imagem NOVA
 *  { id, deleted: true }      -> APAGA a imagem
 *  { id, content: base64 }    -> TROCA o arquivo da imagem
 *  { id, content: "http..." } -> mantém como está
 * E para "options":
 *  { id, deleted: true }      -> APAGA a opção
 *  { id, ...campos }          -> ALTERA a opção
 *  { ...campos } sem id       -> opção NOVA
 */
async function update(id, data = {}) {
  const product = await findOrFail(id);
  const { errors, fields, categoryIds } = validateProduct(data, { partial: true });

  const imageIds = product.images.map((img) => img.id);
  const optionIds = product.options.map((opt) => opt.id);

  // Separa as ações de imagem, validando cada uma
  const imageActions = (data.images || []).map((img, i) => {
    const label = `images[${i}]`;
    if (!img || typeof img !== "object") return errors.push(`${label} inválida`) && null;
    if (img.id !== undefined && !imageIds.includes(img.id)) {
      return errors.push(`${label}.id ${img.id} não pertence a este produto`) && null;
    }
    if (img.id !== undefined && img.deleted === true) return { kind: "delete", id: img.id };
    if (img.id !== undefined) {
      if (typeof img.content === "string" && /^https?:\/\//.test(img.content)) return { kind: "keep" };
      if (!v.isNonEmptyString(img.content)) return errors.push(`${label}.content é obrigatório`) && null;
      const current = product.images.find((x) => x.path && x.id === img.id);
      const type = img.type || guessType(current.path);
      if (!ImageService.isValidType(type)) return errors.push(`${label}.type inválido`) && null;
      return { kind: "replace", id: img.id, type, content: img.content };
    }
    if (!ImageService.isValidType(img.type)) errors.push(`${label}.type deve ser image/png, image/jpeg, image/webp ou image/gif`);
    if (!v.isNonEmptyString(img.content)) errors.push(`${label}.content deve ser o base64 da imagem`);
    return { kind: "create", type: img.type, content: img.content };
  });

  // Separa as ações de opção
  const optionActions = (data.options || []).map((opt, i) => {
    if (!opt || typeof opt !== "object") return errors.push(`options[${i}] inválida`) && null;
    if (opt.id !== undefined && !optionIds.includes(opt.id)) {
      return errors.push(`options[${i}].id ${opt.id} não pertence a este produto`) && null;
    }
    if (opt.id !== undefined && opt.deleted === true) return { kind: "delete", id: opt.id };
    const isNew = opt.id === undefined;
    const values = validateOption(opt, i, isNew, errors);
    return { kind: isNew ? "create" : "update", id: opt.id, values };
  });

  const nothingSent =
    !Object.keys(fields).length && !categoryIds && data.images === undefined && data.options === undefined;
  if (!errors.length && nothingSent) errors.push("Envie ao menos um campo para atualizar");
  if (errors.length) throw new AppError(400, "Dados do produto inválidos", errors);

  const writtenFiles = []; // novos arquivos (apagar se der erro)
  const filesToDelete = []; // arquivos antigos (apagar só se der certo)

  try {
    await sequelize.transaction(async (transaction) => {
      if (fields.slug) await ensureUniqueSlug(fields.slug, product.id, transaction);
      if (Object.keys(fields).length) await product.update(fields, { transaction });

      if (categoryIds) {
        await ensureCategoriesExist(categoryIds, transaction);
        // setCategories SUBSTITUI a lista: tira as antigas e põe as novas
        await product.setCategories(categoryIds, { transaction });
      }

      for (const action of imageActions) {
        if (!action || action.kind === "keep") continue;
        if (action.kind === "delete") {
          const img = product.images.find((x) => x.id === action.id);
          await ProductImage.destroy({ where: { id: action.id }, transaction });
          filesToDelete.push(img.path);
        } else if (action.kind === "replace") {
          const img = product.images.find((x) => x.id === action.id);
          const filePath = await ImageService.save(product.id, action.type, action.content);
          writtenFiles.push(filePath);
          await ProductImage.update({ path: filePath, enabled: true }, { where: { id: action.id }, transaction });
          filesToDelete.push(img.path);
        } else {
          const filePath = await ImageService.save(product.id, action.type, action.content);
          writtenFiles.push(filePath);
          await ProductImage.create({ product_id: product.id, path: filePath, enabled: true }, { transaction });
        }
      }

      for (const action of optionActions) {
        if (!action) continue;
        if (action.kind === "delete") {
          await ProductOption.destroy({ where: { id: action.id }, transaction });
        } else if (action.kind === "update") {
          if (Object.keys(action.values).length) {
            await ProductOption.update(action.values, { where: { id: action.id }, transaction });
          }
        } else {
          await ProductOption.create({ ...action.values, product_id: product.id }, { transaction });
        }
      }
    });
  } catch (err) {
    await Promise.all(writtenFiles.map((f) => ImageService.remove(f)));
    throw err;
  }

  // Só depois que o banco confirmou, apagamos os arquivos antigos
  await Promise.all(filesToDelete.map((f) => ImageService.remove(f)));
}

/** Descobre o tipo pela extensão do arquivo atual: "a.png" -> "image/png" */
function guessType(filePath = "") {
  const ext = filePath.split(".").pop().toLowerCase();
  return { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" }[ext];
}

// ----------------------------------------------------------------------------
// DELETE /v1/product/:id
// ----------------------------------------------------------------------------

async function remove(id) {
  const product = await findOrFail(id);
  // Imagens, opções e ligações com categorias somem pelo CASCADE do banco
  await product.destroy();
  await ImageService.removeProductFolder(product.id);
}

module.exports = { search, getById, create, update, remove, toPublic };
