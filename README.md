# ZeroOnze API — Back-end da loja ZeroOnze Geek Streetwear

API REST da loja **ZeroOnze**, que vende camisetas oversized de anime. Ela cuida de **usuários**, **categorias** e **produtos** (com imagens, opções de tamanho e cor, e categorias) e protege as alterações com **login por token JWT**.

O front-end da loja está em [gutsz-ng/zeroonze-geekstrt](https://github.com/gutsz-ng/zeroonze-geekstrt). O banco já vem com as **16 camisetas do site**, com fotos, preços e descrições.

---

## 1. Tecnologias

| Tecnologia | Para que serve aqui |
|---|---|
| **Node.js** | Roda JavaScript no servidor (fora do navegador) |
| **Express** | Cria as rotas da API (`GET /v1/product/1`...) |
| **MySQL** | Banco de dados onde tudo fica salvo |
| **Sequelize** | ORM: conversa com o MySQL usando JavaScript em vez de SQL |
| **Sequelize CLI** | Roda as *migrations* (criam as tabelas) e os *seeders* (dados iniciais) |
| **JWT** (jsonwebtoken) | Gera o token de login e protege as rotas de alteração |
| **bcrypt** | Guarda a senha como *hash*, que não pode ser revertido |
| **dotenv** | Lê as configurações e senhas do arquivo `.env` |
| **Nodemon** | Reinicia a API sozinho quando você salva um arquivo |
| **Jest + Supertest** | Testes automatizados |
| **Swagger** (swagger-ui-express) | Documentação interativa em `/docs` |
| **CORS** | Deixa o site (em outro endereço) chamar a API |

## 2. Requisitos atendidos

**Funcionalidades essenciais**
- Todos os endpoints do projeto de referência, com os códigos HTTP pedidos (200, 201, 204, 400, 401, 404)
- CRUD completo de usuários, categorias e produtos
- Autenticação com JWT em todos os POST, PUT e DELETE (exceto cadastro e login)
- Autorização: cada usuário só altera ou exclui a própria conta (403)
- Tratamento de erros centralizado, sempre no formato `{ "error": "...", "details": [...] }`

**Qualidade do código**
- Padrão MVC com camada de *services* (Model → Service → Controller → Route)
- Código comentado em português, explicando o porquê de cada decisão

**Banco de dados**
- 6 tabelas criadas por *migrations*, com chaves estrangeiras e `CASCADE`
- Relacionamentos 1:N (imagens e opções) e N:N (categorias)
- Consultas com `include` (evita o problema N+1), paginação e transações

**Documentação**
- Swagger em `/docs`
- Guia de setup neste README e exemplos em `requests.http`

## 3. Estrutura de pastas

```
zeroonze-backend/
├── src/
│   ├── config/          # configurações (.env e banco)
│   ├── controllers/     # recebem a requisição e devolvem a resposta
│   ├── database/
│   │   ├── migrations/  # criam as tabelas, uma mudança por arquivo
│   │   ├── seeders/     # colocam os dados iniciais (16 camisetas)
│   │   └── data/        # JSON com as categorias e os produtos do site
│   ├── docs/            # documentação Swagger
│   ├── middleware/      # auth (JWT), validação de id, erros e 404
│   ├── models/          # uma classe por tabela + relacionamentos
│   ├── routes/          # ligam MÉTODO + URL ao controller
│   ├── services/        # regras de negócio e acesso ao banco
│   ├── utils/           # funções reaproveitadas (erros, validações, filtros)
│   ├── app.js           # monta o Express (usado também nos testes)
│   └── server.js        # conecta no banco e liga a API
├── public/media/        # imagens dos produtos, servidas pela API
├── tests/               # testes automatizados (Jest)
├── .env.example         # modelo do .env
├── .sequelizerc         # diz ao Sequelize CLI onde ficam as pastas
├── requests.http        # requisições prontas para testar no vs Code
└── package.json
```

## 4. Banco de dados

```
users                    categories ──┐
                                      │ N:N
products ──┬── 1:N ── product_images  │
           ├── 1:N ── product_options │
           └──────── product_categories (product_id + category_id)
```

| Tabela | Colunas |
|---|---|
| `users` | id, firstname, surname, email (único), password (hash bcrypt), created_at, updated_at |
| `categories` | id, name, slug (único), use_in_menu, created_at, updated_at |
| `products` | id, enabled, name, slug (único), use_in_menu, stock, description, price, price_with_discount, created_at, updated_at |
| `product_images` | id, product_id → products, enabled, path |
| `product_options` | id, product_id → products, title, shape (square/circle), radius, type (text/color), values |
| `product_categories` | product_id → products, category_id → categories |

## 5. Como rodar no seu computador

### 5.1 Instale o que precisa (uma vez só)
1. **Node.js** (versão LTS): [nodejs.org](https://nodejs.org)
2. **MySQL**. A forma mais fácil no Windows é o **XAMPP** ([apachefriends.org](https://www.apachefriends.org)): instale, abra o *XAMPP Control Panel* e clique em **Start** na linha **MySQL**. O usuário é `root` e a senha fica vazia.
   Também funciona com o [MySQL Installer](https://dev.mysql.com/downloads/installer/) oficial. Nesse caso, use a senha que você criar na instalação.

### 5.2 Baixe e configure o projeto
```bash
git clone https://github.com/gutsz-ng/zeroonze-backend.git
cd zeroonze-backend
npm install
```

Faça uma cópia do arquivo **`.env.example`** com o nome **`.env`** e confira os dados do banco:
```
DB_USER=root
DB_PASSWORD=          ← vazio no XAMPP; a sua senha no MySQL Installer
JWT_SECRET=um-texto-longo-e-aleatorio
```

### 5.3 Crie o banco, as tabelas e os dados
```bash
npm run db:create    # cria o banco "zeroonze"
npm run db:migrate   # cria as 6 tabelas
npm run db:seed      # coloca o usuário admin, as categorias e as 16 camisetas
```

### 5.4 Ligue a API
```bash
npm run dev
```
Pronto:
- API: **http://localhost:3000**
- Documentação (Swagger): **http://localhost:3000/docs**
- Exemplo: **http://localhost:3000/v1/product/search?limit=3**

**Usuário de demonstração:** `admin@zeroonze.com` / `123@123`

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Liga a API e reinicia a cada alteração (nodemon) |
| `npm start` | Liga a API sem reiniciar sozinha (produção) |
| `npm test` | Roda os testes automatizados |
| `npm run db:create` | Cria o banco de dados |
| `npm run db:migrate` | Roda as migrations (cria as tabelas) |
| `npm run db:seed` | Roda os seeders (dados iniciais) |
| `npm run db:reset` | Apaga as tabelas, recria e coloca os dados de novo |

## 6. Endpoints

 = precisa do cabeçalho `Authorization: Bearer <token>`

### Usuários
| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/v1/user/:id` | Dados do usuário (sem a senha) | 200 |
| POST | `/v1/user` | Cadastro | 201 |
| POST | `/v1/user/token` | Login: devolve o token JWT | 200 |
| PUT  | `/v1/user/:id` | Atualiza nome, sobrenome e e-mail (só a própria conta) | 204 |
| DELETE  | `/v1/user/:id` | Exclui a conta (só a própria) | 204 |

### Categorias
| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/v1/category/search` | Lista: `limit`, `page`, `fields`, `use_in_menu` | 200 |
| GET | `/v1/category/:id` | Uma categoria | 200 |
| POST | `/v1/category` | Cria | 201 |
| PUT | `/v1/category/:id` | Atualiza | 204 |
| DELETE | `/v1/category/:id` | Exclui | 204 |

### Produtos
| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/v1/product/search` | Lista com filtros (abaixo) | 200 |
| GET | `/v1/product/:id` | Um produto, com imagens, opções e categorias | 200 |
| POST  | `/v1/product` | Cria (imagens em base64) | 201 |
| PUT  | `/v1/product/:id` | Atualiza, inclusive imagens e opções | 204 |
| DELETE  | `/v1/product/:id` | Exclui (com imagens e opções) | 204 |

**Filtros de `/v1/product/search`**

| Parâmetro | Exemplo | Efeito |
|---|---|---|
| `limit` | `limit=30` | Itens por página (padrão 12; `-1` = todos) |
| `page` | `page=2` | Página (padrão 1) |
| `fields` | `fields=name,images,price` | Devolve só esses campos |
| `match` | `match=kakaroto` | Procura no nome ou na descrição |
| `category_ids` | `category_ids=1,7` | Produtos dessas categorias |
| `price-range` | `price-range=80-100` | Preço entre os dois valores |
| `option[id]` | `option[1]=GG,P` | Produtos cuja opção 1 tenha GG ou P |

**Erros**

| Código | Quando |
|---|---|
| 400 | Dados errados, JSON inválido, id que não é número ou falta do cabeçalho `Authorization` |
| 401 | Token inválido ou expirado |
| 403 | Tentativa de alterar a conta de outra pessoa |
| 404 | O recurso não existe, ou a rota não existe |
| 500 | Erro inesperado no servidor |

## 7. Como testar

**No navegador:** abra **http://localhost:3000/docs**.
1. Em `POST /v1/user/token`, clique em *Try it out* e depois em *Execute* (os dados do admin já estão preenchidos).
2. Copie o token, clique no cadeado **Authorize** e cole.
3. Agora as rotas também funcionam.

**No VS Code:** instale a extensão **REST Client** e abra o arquivo `requests.http`. Clique em *Send Request* em cima de cada requisição.

**Testes automatizados:**
```bash
npm test
```

## 8. Decisões tomadas

- **400 ou 401 sem token?** Os requisitos dizem duas coisas. Os endpoints pedem 401, mas a Seção 05 pede 400 quando o cabeçalho `Authorization` não é enviado. Seguimos a Seção 05, que trata do token: **sem cabeçalho = 400** e **token inválido ou expirado = 401**.
- **Cadastro e login são públicos**, porque quem se cadastra ainda não tem token.
- **403 para a conta de outra pessoa.** Estar logado (autenticação) não basta: é preciso ser o dono da conta (autorização).
- **`description` com até 1000 caracteres.** Algumas descrições da loja passam dos 255 do `STRING` padrão.
- **Query string no modo `simple`.** O modo padrão do Express transformaria `option[1]=GG` numa lista e perderia o id 1 da opção.
- **Imagens em disco, caminho no banco.** O arquivo vai para `public/media/product-<id>/` e o banco guarda só o caminho. Guardar imagens dentro do banco deixa tudo lento.
- **Transações** no cadastro e na atualização de produtos: ou tudo é salvo, ou nada é.

## 9. Autor

Projeto desenvolvido por **Gustavo Nogueira**. Contato: gutsz.ng@gmail.com

As estampas são obras da marca By Zero Onze inspiradas em animes. Os personagens pertencem aos seus respectivos autores.
