/**
 * CONTROLLER DE USUÁRIOS (o "C" do MVC).
 *
 * O controller é a "porta de entrada" de cada rota. Ele:
 *  1. pega os dados da requisição (req.params, req.body, req.user);
 *  2. chama o service, que faz o trabalho de verdade;
 *  3. responde com o status HTTP certo.
 * Ele NÃO valida regras nem fala com o banco. Por isso é tão curto.
 *
 * STATUS USADOS:
 *  200 OK         -> deu certo e tem corpo na resposta
 *  201 Created    -> algo novo foi criado
 *  204 No Content -> deu certo e a resposta não tem corpo (.end())
 */
const UserService = require("../services/UserService");

module.exports = {
  // GET /v1/user/:id
  async show(req, res) {
    const user = await UserService.getById(Number(req.params.id));
    res.status(200).json(user);
  },

  // POST /v1/user
  async store(req, res) {
    const user = await UserService.create(req.body);
    res.status(201).json(user);
  },

  // PUT /v1/user/:id
  async update(req, res) {
    await UserService.update(Number(req.params.id), req.body, req.user);
    res.status(204).end();
  },

  // DELETE /v1/user/:id
  async destroy(req, res) {
    await UserService.remove(Number(req.params.id), req.user);
    res.status(204).end();
  },

  // POST /v1/user/token
  async token(req, res) {
    const result = await UserService.generateToken(req.body);
    res.status(200).json(result);
  },
};
