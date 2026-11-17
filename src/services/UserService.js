/**
 * SERVICE DE USUÁRIOS (regras de negócio).
 *
 * POR QUE SEPARAR SERVICE DE CONTROLLER?
 * - O CONTROLLER só conversa com o HTTP: lê req, chama o service e
 *   escolhe o status da resposta.
 * - O SERVICE tem as regras: validar dados, conferir se o e-mail já
 *   existe, gerar o hash da senha, falar com o banco.
 * Assim, as regras podem ser testadas e reaproveitadas sem depender
 * do Express. Essa divisão segue o "S" do SOLID: cada parte com uma
 * responsabilidade só.
 */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const AppError = require("../utils/AppError");
const { isNonEmptyString, isEmail } = require("../utils/validators");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

// Quantas "rodadas" o bcrypt usa para gerar o hash. Mais rodadas = mais
// lento para um invasor testar senhas. 10 é o valor padrão recomendado.
const SALT_ROUNDS = 10;

// Campos que podem aparecer numa resposta (a senha nunca está aqui)
const PUBLIC_FIELDS = ["id", "firstname", "surname", "email"];

/** Converte o registro do banco no formato da resposta da API. */
function toPublic(user) {
  return PUBLIC_FIELDS.reduce((acc, f) => ({ ...acc, [f]: user[f] }), {});
}

/** Busca um usuário ou lança 404. */
async function findOrFail(id) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError(404, "Usuário não encontrado");
  return user;
}

/** GET /v1/user/:id */
async function getById(id) {
  return toPublic(await findOrFail(id));
}

/** POST /v1/user (cadastro) */
async function create(data = {}) {
  const { firstname, surname, email, password, confirmPassword } = data;

  // Juntamos TODOS os problemas antes de responder, para o front
  // mostrar todos de uma vez, em vez de um por tentativa.
  const errors = [];
  if (!isNonEmptyString(firstname)) errors.push("firstname é obrigatório");
  if (!isNonEmptyString(surname)) errors.push("surname é obrigatório");
  if (!isEmail(email)) errors.push("email deve ser um e-mail válido");
  if (typeof password !== "string" || password.length < 6) {
    errors.push("password deve ter pelo menos 6 caracteres");
  }
  if (password !== confirmPassword) errors.push("confirmPassword deve ser igual a password");
  if (errors.length) throw new AppError(400, "Dados de cadastro inválidos", errors);

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.findOne({ where: { email: normalizedEmail } })) {
    throw new AppError(400, "Já existe um usuário com esse e-mail");
  }

  // bcrypt.hash gera um texto como "$2b$10$..." que NÃO pode ser
  // revertido para a senha original. No login, comparamos com bcrypt.compare.
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    firstname: firstname.trim(),
    surname: surname.trim(),
    email: normalizedEmail,
    password: hash,
  });
  return toPublic(user);
}

/**
 * PUT /v1/user/:id
 * AUTORIZAÇÃO: cada pessoa só altera a própria conta. Estar logado
 * (autenticação) não basta; tem que ser o dono da conta (autorização).
 */
async function update(id, data = {}, authUser) {
  const user = await findOrFail(id);
  if (user.id !== authUser.id) {
    throw new AppError(403, "Você só pode alterar a sua própria conta");
  }

  const changes = {};
  const errors = [];

  // Só mexemos nos campos que vieram no corpo. A senha não muda por aqui.
  if (data.firstname !== undefined) {
    if (isNonEmptyString(data.firstname)) changes.firstname = data.firstname.trim();
    else errors.push("firstname não pode ser vazio");
  }
  if (data.surname !== undefined) {
    if (isNonEmptyString(data.surname)) changes.surname = data.surname.trim();
    else errors.push("surname não pode ser vazio");
  }
  if (data.email !== undefined) {
    if (isEmail(data.email)) changes.email = data.email.trim().toLowerCase();
    else errors.push("email deve ser um e-mail válido");
  }
  if (errors.length) throw new AppError(400, "Dados inválidos", errors);
  if (!Object.keys(changes).length) {
    throw new AppError(400, "Envie ao menos um campo: firstname, surname ou email");
  }

  if (changes.email && changes.email !== user.email) {
    if (await User.findOne({ where: { email: changes.email } })) {
      throw new AppError(400, "Já existe um usuário com esse e-mail");
    }
  }

  await user.update(changes);
}

/** DELETE /v1/user/:id (também só a própria conta) */
async function remove(id, authUser) {
  const user = await findOrFail(id);
  if (user.id !== authUser.id) {
    throw new AppError(403, "Você só pode excluir a sua própria conta");
  }
  await user.destroy();
}

/** POST /v1/user/token (login) */
async function generateToken(data = {}) {
  const { email, password } = data;
  if (!isEmail(email) || !isNonEmptyString(password)) {
    throw new AppError(400, "Informe email e password");
  }

  // scope("withPassword") porque, por padrão, o model esconde a senha
  const user = await User.scope("withPassword").findOne({
    where: { email: email.trim().toLowerCase() },
  });

  // Mesma mensagem para "e-mail não existe" e "senha errada": assim
  // ninguém usa o login para descobrir quais e-mails estão cadastrados.
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw new AppError(400, "E-mail ou senha incorretos");

  // O "payload" é o que vai DENTRO do token. Qualquer um consegue ler
  // (não é criptografado, só assinado), então nunca coloque a senha nele.
  const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
  return { token };
}

module.exports = { getById, create, update, remove, generateToken };
