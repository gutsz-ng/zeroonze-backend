/**
 * Confere se o :id da URL é um número inteiro positivo.
 *
 * Sem isso, GET /v1/product/abc chegaria até o banco à toa.
 * Um id com formato errado é erro de quem chamou: 400 (Bad Request).
 * Um id bem formado que não existe continua sendo 404 (Not Found),
 * e quem descobre isso é o service.
 */
const AppError = require("../utils/AppError");

module.exports = function validateId(req, _res, next) {
  if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) {
    return next(new AppError(400, "O id deve ser um número inteiro positivo"));
  }
  return next();
};
