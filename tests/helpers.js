/** Gera um token válido para testar as rotas protegidas. */
const jwt = require("jsonwebtoken");

const tokenFor = (user = { id: 1, email: "admin@zeroonze.com" }) =>
  jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });

module.exports = { tokenFor };
