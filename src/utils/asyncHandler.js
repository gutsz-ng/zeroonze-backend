/**
 * Envolve um controller assíncrono para que erros cheguem ao errorHandler.
 *
 * POR QUE PRECISA DISSO?
 * O Express 4 não percebe sozinho quando uma função "async" dá erro
 * (a Promise é rejeitada e ninguém trata). Sem isso, a requisição
 * ficaria travada até dar timeout. Este helper captura o erro e chama
 * next(erro), que leva direto ao middleware de erros.
 *
 * Uso: router.get("/:id", asyncHandler(controller.show));
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
