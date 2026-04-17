const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

// LISTAR USUÁRIOS
exports.getUsers = (req, res) => {
  db.query(
    "SELECT id, nome, email, data_criacao FROM users",
    (err, results) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      res.json(results);
    }
  );
};

// BUSCAR USUÁRIOS
exports.searchUsers = (req, res) => {
  const usuarioLogadoId = req.user.id;
  const termo = (req.query.q || "").trim();

  const sql = `
    SELECT
      u.id,
      u.nome,
      u.email,
      EXISTS (
        SELECT 1
        FROM seguidores s
        WHERE s.seguidor_id = ? AND s.seguindo_id = u.id
      ) AS seguindo
    FROM users u
    WHERE u.id <> ?
      AND (
        u.nome LIKE ?
        OR u.email LIKE ?
      )
    ORDER BY u.nome ASC
    LIMIT 20
  `;

  const busca = `%${termo}%`;

  db.query(sql, [usuarioLogadoId, usuarioLogadoId, busca, busca], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json(results);
  });
};

// PERFIL DE UM USUÁRIO
exports.getUserProfile = (req, res) => {
  const usuarioLogadoId = req.user.id;
  const perfilId = Number(req.params.id);

  const sql = `
    SELECT
      u.id,
      u.nome,
      u.email,
      u.tipo,
      u.data_criacao,
      (SELECT COUNT(*) FROM seguidores WHERE seguindo_id = u.id) AS seguidores,
      (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id) AS seguindo,
      EXISTS (
        SELECT 1
        FROM seguidores s
        WHERE s.seguidor_id = ? AND s.seguindo_id = u.id
      ) AS euSigo
    FROM users u
    WHERE u.id = ?
  `;

  db.query(sql, [usuarioLogadoId, perfilId], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json(results[0]);
  });
};

// SEGUIR USUÁRIO
exports.followUser = (req, res) => {
  const seguidorId = req.user.id;
  const seguindoId = Number(req.params.id);

  if (seguidorId === seguindoId) {
    return res.status(400).json({ erro: "Você não pode seguir a si mesmo." });
  }

  db.query("SELECT id FROM users WHERE id = ?", [seguindoId], (err, users) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    if (users.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const sql = "INSERT IGNORE INTO seguidores (seguidor_id, seguindo_id) VALUES (?, ?)";

    db.query(sql, [seguidorId, seguindoId], (err2) => {
      if (err2) {
        return res.status(500).json({ erro: err2.message });
      }

      res.status(201).json({ mensagem: "Usuário seguido com sucesso." });
    });
  });
};

// DEIXAR DE SEGUIR
exports.unfollowUser = (req, res) => {
  const seguidorId = req.user.id;
  const seguindoId = Number(req.params.id);

  const sql = "DELETE FROM seguidores WHERE seguidor_id = ? AND seguindo_id = ?";

  db.query(sql, [seguidorId, seguindoId], (err) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json({ mensagem: "Usuário deixado de seguir com sucesso." });
  });
};

// CRIAR USUÁRIO
exports.createUser = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, email e senha são obrigatórios" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const sql = "INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)";

    db.query(sql, [nome, email, senhaHash], (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro no banco de dados",
          detalhes: err.message
        });
      }

      res.status(201).json({
        mensagem: "Usuário criado com sucesso",
        id: result.insertId
      });
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// LOGIN
exports.login = (req, res) => {
  const { email, senha } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ erro: "Usuário não encontrado" });
    }

    const user = results[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      }
    });
  });
};