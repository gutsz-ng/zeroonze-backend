/**
 * Responde 404 quando nenhuma rota combinou com a URL.
 * Fica registrado DEPOIS de todas as rotas em app.js: se a requisição
 * chegou até aqui, é porque ninguém a atendeu.
 */
const AppError = require("../utils/AppError");

module.exports = function notFound(req, _res, next) {
  next(new AppError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`));
};
