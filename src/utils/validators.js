/**
 * Funções pequenas de validação, reutilizadas pelos services.
 * Cada uma responde só "sim" ou "não" (true/false), o que as deixa
 * fáceis de testar e de combinar.
 */

/** Texto com pelo menos um caractere que não seja espaço. */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

/** Formato básico de e-mail: algo@algo.algo */
const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Slug: letras minúsculas, números e hífens. Ex.: "dragon-ball" */
const isSlug = (v) => typeof v === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);

/** Verdadeiro ou falso de verdade (não aceita "true" em texto). */
const isBoolean = (v) => typeof v === "boolean";

/** Número válido maior ou igual a zero (preço, por exemplo). */
const isNonNegativeNumber = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Número inteiro maior ou igual a zero (estoque, por exemplo). */
const isNonNegativeInteger = (v) => Number.isInteger(v) && v >= 0;

/** Número inteiro maior que zero (um id, por exemplo). */
const isPositiveInteger = (v) => Number.isInteger(v) && v > 0;

module.exports = {
  isNonEmptyString,
  isEmail,
  isSlug,
  isBoolean,
  isNonNegativeNumber,
  isNonNegativeInteger,
  isPositiveInteger,
};
