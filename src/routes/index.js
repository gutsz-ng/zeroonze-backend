/**
 * Junta todas as rotas da versão 1 da API.
 *
 * POR QUE "/v1"?
 * Se um dia a API mudar de um jeito que quebre os apps antigos, criamos
 * "/v2" e deixamos "/v1" funcionando para quem ainda usa. Isso se chama
 * VERSIONAMENTO de API.
 */
const { Router } = require("express");

const router = Router();

router.use("/user", require("./userRoutes"));
router.use("/category", require("./categoryRoutes"));
router.use("/product", require("./productRoutes"));

module.exports = router;
