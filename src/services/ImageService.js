/**
 * SERVICE DE IMAGENS: grava e apaga arquivos de imagem no disco.
 *
 * COMO AS IMAGENS CHEGAM?
 * Pelo requisito, o front manda a imagem dentro do JSON em BASE64:
 * o arquivo convertido em texto, ex.: "iVBORw0KGgoAAAANS...".
 * Aqui transformamos esse texto de volta em arquivo e salvamos em
 *   public/media/product-<id>/<nome-aleatório>.png
 * No banco guardamos só o CAMINHO ("media/product-3/abc.png"). A pasta
 * public é servida pelo Express, então a imagem abre em
 *   http://localhost:3000/media/product-3/abc.png
 */
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const AppError = require("../utils/AppError");

const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "public");

// Tipos aceitos e a extensão de arquivo de cada um
const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Pasta (relativa a public/) onde ficam as imagens enviadas de um produto. */
const productFolder = (productId) => `media/product-${productId}`;

/** É um tipo de imagem que aceitamos? */
const isValidType = (type) => Object.prototype.hasOwnProperty.call(EXTENSIONS, type);

/**
 * Transforma o base64 em bytes.
 * Aceita tanto o base64 puro quanto o formato "data:image/png;base64,AAAA".
 */
function decodeBase64(content) {
  if (typeof content !== "string" || !content.trim()) {
    throw new AppError(400, "O conteúdo da imagem (content) deve ser um texto em base64");
  }
  const raw = content.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    throw new AppError(400, "O conteúdo da imagem (content) não é um base64 válido");
  }
  const buffer = Buffer.from(raw, "base64");
  if (!buffer.length) throw new AppError(400, "A imagem enviada está vazia");
  return buffer;
}

/**
 * Salva a imagem e devolve o caminho relativo para guardar no banco.
 * Usamos um nome aleatório para dois envios nunca sobrescreverem um ao outro.
 */
async function save(productId, type, content) {
  if (!isValidType(type)) {
    throw new AppError(400, `Tipo de imagem não suportado: ${type}`, [
      `Tipos aceitos: ${Object.keys(EXTENSIONS).join(", ")}`,
    ]);
  }
  const buffer = decodeBase64(content);
  const folder = productFolder(productId);
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${EXTENSIONS[type]}`;

  await fs.mkdir(path.join(PUBLIC_DIR, folder), { recursive: true });
  await fs.writeFile(path.join(PUBLIC_DIR, folder, fileName), buffer);
  return `${folder}/${fileName}`;
}

/**
 * Apaga um arquivo enviado pela API.
 * Só apaga dentro de "media/product-<id>/". As fotos de exemplo
 * (media/produtos/) são compartilhadas e nunca são apagadas.
 */
async function remove(relativePath) {
  if (!/^media\/product-\d+\//.test(relativePath)) return;
  try {
    await fs.unlink(path.join(PUBLIC_DIR, relativePath));
  } catch (err) {
    if (err.code !== "ENOENT") throw err; // arquivo já não existia: tudo bem
  }
}

/** Apaga a pasta inteira de um produto (usado ao excluir o produto). */
async function removeProductFolder(productId) {
  await fs.rm(path.join(PUBLIC_DIR, productFolder(productId)), { recursive: true, force: true });
}

module.exports = { save, remove, removeProductFolder, isValidType };
