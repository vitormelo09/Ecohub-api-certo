const db = require("../config/db");

exports.getPosts = (req, res) => {
  const authHeader = req.headers.authorization;
  let usuarioId = null;

  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const jwt = require("jsonwebtoken");
      const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";
      const decoded = jwt.verify(token, SECRET);
      usuarioId = decoded.id;
    } catch (_) {
      usuarioId = null;
    }
  }

  const sql = `
    SELECT
      p.id,
      p.usuario_id,
      p.conteudo,
      p.imagem_url,
      p.data_publicacao,
      u.nome,
      COUNT(DISTINCT l.id) AS likes,
      ${
        usuarioId
          ? `MAX(CASE WHEN l.usuario_id = ${Number(usuarioId)} THEN 1 ELSE 0 END)`
          : `0`
      } AS curtidoPorMim
    FROM posts p
    JOIN users u ON p.usuario_id = u.id
    LEFT JOIN likes l ON l.post_id = p.id
    GROUP BY p.id, p.usuario_id, p.conteudo, p.imagem_url, p.data_publicacao, u.nome
    ORDER BY p.data_publicacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json(results);
  });
};

exports.createPost = (req, res) => {
  const { conteudo } = req.body;
  const usuario_id = req.user.id;
  const imagem_url = req.file ? req.file.filename : null;

  const sql = "INSERT INTO posts (usuario_id, conteudo, imagem_url) VALUES (?, ?, ?)";

  db.query(sql, [usuario_id, conteudo, imagem_url], (err, result) => {
    if (err) return res.status(500).json({ erro: err.message });

    res.status(201).json({
      mensagem: "Post criado!",
      id: result.insertId
    });
  });
};

exports.deletePost = (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  db.query("SELECT * FROM posts WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });

    if (results.length === 0) {
      return res.status(404).json({ erro: "Post não encontrado" });
    }

    if (results[0].usuario_id !== usuario_id) {
      return res.status(403).json({ erro: "Você não tem permissão para deletar este post" });
    }

    db.query("DELETE FROM posts WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ erro: err2.message });

      res.json({ mensagem: "Post removido!" });
    });
  });
};