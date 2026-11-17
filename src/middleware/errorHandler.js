/**
 * TRATAMENTO CENTRAL DE ERROS.
 *
 * O Express reconhece um middleware de erro por ele ter QUATRO
 * parâmetros (err, req, res, next). Qualquer next(erro) ou erro
 * capturado pelo asyncHandler cai aqui.
 *
 * Vantagem: todas as respostas de erro têm o mesmo formato,
 *   { "error": "mensagem", "details": [ ... ] }
 * e o status HTTP correto, sem repetir try/catch em cada controller.
 */
const AppError = require("../utils/AppError");

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, _req, res, _next) {
  // 1) Erros que nós mesmos lançamos, já com o status certo
  if (err instanceof AppError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  // 2) JSON mal escrito no corpo da requisição (ex.: vírgula sobrando)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "O corpo da requisição não é um JSON válido" });
  }

  // 3) Corpo grande demais (ex.: imagem em base64 muito pesada)
  if (err.type === "entity.too.large") {
    return res.status(400).json({ error: "O corpo da requisição é grande demais (máximo 10 MB)" });
  }

  // 4) Erros do banco que são culpa dos dados enviados
  if (err.name === "SequelizeUniqueConstraintError") {
    const campos = (err.errors || []).map((e) => e.path).filter(Boolean);
    return res.status(400).json({
      error: "Já existe um registro com esse valor",
      details: campos.length ? campos.map((c) => `Campo repetido: ${c}`) : undefined,
    });
  }
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Dados inválidos",
      details: (err.errors || []).map((e) => e.message),
    });
  }
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({ error: "Referência inválida: um dos ids informados não existe" });
  }

  // 5) Qualquer outra coisa é falha nossa: 500. Mostramos o detalhe só no
  //    terminal, para não expor informações internas a quem chamou a API.
  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
};
