const jwt = require("jsonwebtoken");

const SECRET = "segredo_super_secreto"; // depois podemos colocar em .env

function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email
    },
    SECRET,
    {
      expiresIn: "1d"
    }
  );
}

function verificarToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = {
  gerarToken,
  verificarToken,
  SECRET
};