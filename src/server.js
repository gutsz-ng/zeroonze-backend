/**
 * PONTO DE PARTIDA DA API ("npm run dev" ou "npm start" rodam este arquivo).
 *
 * 1. Confere se as configurações obrigatórias existem.
 * 2. Testa a conexão com o banco (authenticate).
 * 3. Só então abre a porta. Se o banco estiver fora do ar, é melhor
 *    avisar logo do que subir uma API que vai falhar em toda requisição.
 */
const app = require("./app");
const { sequelize } = require("./models");
const { port, baseUrl, jwtSecret } = require("./config/env");

async function start() {
  if (!jwtSecret) {
    console.error("Falta JWT_SECRET no arquivo .env. Copie o .env.example para .env e preencha.");
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log("Banco de dados conectado.");
  } catch (err) {
    console.error("Não foi possível conectar ao MySQL. Confira se ele está ligado e os dados do .env.");
    console.error(`Detalhe: ${err.message}`);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API rodando em ${baseUrl}`);
    console.log(`Documentação em ${baseUrl}/docs`);
  });
}

start();
