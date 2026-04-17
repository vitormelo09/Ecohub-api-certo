const jwt = require("jsonwebtoken");

// Usa a variável de ambiente (se existir) ou o segredo padrão
const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      erro: "Token não fornecido"
    });
  }

  // Pega apenas o código do token, ignorando a palavra "Bearer"
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    req.user = decoded; // Salva os dados do usuário na requisição
    next(); // Passa para o próximo passo (ou rota)
  } catch (error) {
    return res.status(401).json({
      erro: "Token inválido"
    });
  }
};

module.exports = authMiddleware;