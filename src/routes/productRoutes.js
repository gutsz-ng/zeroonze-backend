/** ROTAS DE PRODUTO. Mesma organização das categorias. */
const { Router } = require("express");
const ProductController = require("../controllers/ProductController");
const auth = require("../middleware/auth");
const validateId = require("../middleware/validateId");
const asyncHandler = require("../utils/asyncHandler");

const router = Router();

router.get("/search", asyncHandler(ProductController.index));
router.get("/:id", validateId, asyncHandler(ProductController.show));
router.post("/", auth, asyncHandler(ProductController.store));
router.put("/:id", validateId, auth, asyncHandler(ProductController.update));
router.delete("/:id", validateId, auth, asyncHandler(ProductController.destroy));

module.exports = router;
