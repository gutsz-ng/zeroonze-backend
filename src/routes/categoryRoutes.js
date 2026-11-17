/**
 * ROTAS DE CATEGORIA.
 *
 * ATENÇÃO À ORDEM: "/search" vem ANTES de "/:id". O Express testa as
 * rotas de cima para baixo. Se "/:id" viesse primeiro, a palavra
 * "search" seria tratada como um id.
 */
const { Router } = require("express");
const CategoryController = require("../controllers/CategoryController");
const auth = require("../middleware/auth");
const validateId = require("../middleware/validateId");
const asyncHandler = require("../utils/asyncHandler");

const router = Router();

router.get("/search", asyncHandler(CategoryController.index));
router.get("/:id", validateId, asyncHandler(CategoryController.show));
router.post("/", auth, asyncHandler(CategoryController.store));
router.put("/:id", validateId, auth, asyncHandler(CategoryController.update));
router.delete("/:id", validateId, auth, asyncHandler(CategoryController.destroy));

module.exports = router;
