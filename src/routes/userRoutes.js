/**
 * ROTAS DE USUÁRIO: ligam "MÉTODO + CAMINHO" ao controller.
 *
 * Leia cada linha assim:
 *   router.put("/:id", validateId, auth, asyncHandler(UserController.update))
 *   "Quando chegar um PUT em /v1/user/5: confira o id, confira o token
 *    e, se tudo passar, chame UserController.update."
 * Os middlewares rodam na ordem em que aparecem.
 *
 * Cadastro (POST /) e login (POST /token) NÃO pedem token: quem está
 * se cadastrando ou entrando ainda não tem um.
 */
const { Router } = require("express");
const UserController = require("../controllers/UserController");
const auth = require("../middleware/auth");
const validateId = require("../middleware/validateId");
const asyncHandler = require("../utils/asyncHandler");

const router = Router();

router.post("/token", asyncHandler(UserController.token));
router.post("/", asyncHandler(UserController.store));
router.get("/:id", validateId, asyncHandler(UserController.show));
router.put("/:id", validateId, auth, asyncHandler(UserController.update));
router.delete("/:id", validateId, auth, asyncHandler(UserController.destroy));

module.exports = router;
