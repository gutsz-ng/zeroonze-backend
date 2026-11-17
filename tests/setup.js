/**
 * Roda antes de cada arquivo de teste (configurado em package.json > jest).
 * Define um segredo de teste para o JWT, sem depender do seu .env.
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "segredo-so-para-testes";
process.env.BASE_URL = "http://localhost:3000";
