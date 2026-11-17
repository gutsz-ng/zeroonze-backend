/**
 * Configurações gerais da aplicação.
 *
 * POR QUE ESTE ARQUIVO EXISTE?
 * O "dotenv" lê o arquivo .env e coloca cada linha em process.env
 * (ex.: process.env.PORT). Em vez de espalhar process.env pelo código
 * inteiro, juntamos tudo aqui, já com valores padrão e convertido para
 * o tipo certo (número, texto). Assim, se um dia mudar o nome de uma
 * variável, só este arquivo muda.
 */
require("dotenv").config();

const port = Number(process.env.PORT) || 3000;

module.exports = {
  port,
  // Remove a barra do final, se houver, para não gerar "//media"
  baseUrl: (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, ""),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
