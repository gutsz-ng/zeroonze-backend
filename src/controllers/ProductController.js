/** CONTROLLER DE PRODUTOS. Mesmo padrão dos outros controllers. */
const ProductService = require("../services/ProductService");

module.exports = {
  // GET /v1/product/search
  async index(req, res) {
    res.status(200).json(await ProductService.search(req.query));
  },

  // GET /v1/product/:id
  async show(req, res) {
    res.status(200).json(await ProductService.getById(Number(req.params.id)));
  },

  // POST /v1/product
  async store(req, res) {
    res.status(201).json(await ProductService.create(req.body));
  },

  // PUT /v1/product/:id
  async update(req, res) {
    await ProductService.update(Number(req.params.id), req.body);
    res.status(204).end();
  },

  // DELETE /v1/product/:id
  async destroy(req, res) {
    await ProductService.remove(Number(req.params.id));
    res.status(204).end();
  },
};
