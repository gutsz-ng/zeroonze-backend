/**
 * MIDDLEWARE DE AUTENTICAÇÃO (protege as rotas POST, PUT e DELETE).
 *
 * O QUE É UM MIDDLEWARE?
 * É uma função que roda ANTES do controller, no meio do caminho
 * ("middle"). Ela recebe (req, res, next) e decide:
 *  - deixar passar: chama next()
 *  - barrar: chama next(erro), e o errorHandler responde
 *
 * COMO O JWT FUNCIONA AQUI?
 * 1. O usuário faz login em POST /v1/user/token e recebe um token.
 * 2. Nas próximas requisições ele manda o cabeçalho:
 *      Authorization: Bearer <token>
 * 3. Este middleware confere a ASSINATURA do token com o JWT_SECRET.
 *    Se alguém alterar uma letra do token, a assinatura não bate.
 * 4. Se estiver tudo certo, guardamos os dados do usuário em req.user
 *    para o controller saber QUEM está fazendo a ação.
 *
 * SOBRE 400 x 401:
 * Os requisitos da escola dizem, na Seção 05, que a falta do cabeçalho
 * Authorization deve dar 400 (Bad Request). Já um token que veio mas é
 * inválido ou expirou recebe 401 (Unauthorized), como pedem os endpoints.
 */
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { jwtSecret } = require("../config/env");

module.exports = function auth(req, _res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return next(new AppError(400, "Envie o cabeçalho Authorization: Bearer <token>"));
  }

  // "Bearer abc.def.ghi" -> ["Bearer", "abc.def.ghi"]
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(400, "O cabeçalho Authorization deve ter o formato: Bearer <token>"));
  }

  try {
    // verify() confere a assinatura E a validade. Se falhar, lança um erro.
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (_err) {
    return next(new AppError(401, "Token inválido ou expirado"));
  }
};
