/**
 * MONTAGEM DA APLICAÇÃO EXPRESS.
 *
 * POR QUE app.js E server.js SEPARADOS?
 * - app.js monta a aplicação (middlewares e rotas) e a EXPORTA.
 * - server.js conecta no banco e coloca a aplicação para "ouvir" a porta.
 * Nos testes importamos só o app.js: o supertest faz requisições direto
 * nele, sem abrir porta nem precisar do banco ligado.
 *
 * A ORDEM IMPORTA: cada requisição passa pelos app.use() de cima para baixo.
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Como ler a query string (a parte depois do "?").
// O modo padrão do Express 4 ("extended") transforma "option[1]=GG" numa
// LISTA e perde o número 1, que aqui é o id da opção. O modo "simple"
// mantém a chave como veio ("option[1]"), e o service sabe interpretar.
app.set("query parser", "simple");

// CORS: o navegador bloqueia, por segurança, um site (ex.: o front no
// GitHub Pages) que tenta chamar uma API em OUTRO endereço. Este
// middleware avisa ao navegador que a nossa API aceita essas chamadas.
app.use(cors());

// Lê o corpo das requisições em JSON e coloca em req.body.
// O limite de 10 MB é por causa das imagens em base64.
app.use(express.json({ limit: "10mb" }));

// Arquivos estáticos: tudo em /public fica acessível pela URL.
// Ex.: public/media/produtos/zoro.jpg -> http://localhost:3000/media/produtos/zoro.jpg
app.use(express.static(path.resolve(__dirname, "..", "public")));

// Documentação interativa da API (Swagger) em http://localhost:3000/docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota raiz: só para conferir se a API está no ar
app.get("/", (_req, res) => {
  res.json({ name: "ZeroOnze API", version: "1.0.0", docs: "/docs" });
});

// Todas as rotas da API começam com /v1
app.use("/v1", routes);

// Se nenhuma rota respondeu: 404. E por último, o tratamento de erros.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
