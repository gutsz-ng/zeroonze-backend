/**
 * Erro "conhecido" da aplicação, com o status HTTP que deve ser devolvido.
 *
 * POR QUE UMA CLASSE PRÓPRIA?
 * Quando o service descobre um problema (ex.: usuário não existe), ele faz
 *   throw new AppError(404, "Usuário não encontrado");
 * e o middleware errorHandler transforma isso na resposta HTTP certa.
 * Assim, nenhum service precisa conhecer o "res" do Express, e a regra
 * "como responder um erro" fica num lugar só.
 */
class AppError extends Error {
  /**
   * @param {number} status  código HTTP (400, 401, 403, 404...)
   * @param {string} message mensagem para quem chamou a API
   * @param {string[]} [details] lista de problemas encontrados (opcional)
   */
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

module.exports = AppError;
