/**
 * CONTROLLER DE CATEGORIAS. Mesmo padrão do UserController.
 * Os nomes index/show/store/update/destroy são uma convenção comum
 * em APIs REST (listar, mostrar um, criar, atualizar, apagar).
 */
const CategoryService = require("../services/CategoryService");

module.exports = {
  // GET /v1/category/search
  async index(req, res) {
    res.status(200).json(await CategoryService.search(req.query));
  },

  // GET /v1/category/:id
  async show(req, res) {
    res.status(200).json(await CategoryService.getById(Number(req.params.id)));
  },

  // POST /v1/category
  async store(req, res) {
    res.status(201).json(await CategoryService.create(req.body));
  },

  // PUT /v1/category/:id
  async update(req, res) {
    await CategoryService.update(Number(req.params.id), req.body);
    res.status(204).end();
  },

  // DELETE /v1/category/:id
  async destroy(req, res) {
    await CategoryService.remove(Number(req.params.id));
    res.status(204).end();
  },
};
