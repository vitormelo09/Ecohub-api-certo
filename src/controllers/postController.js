const db = require("../config/db");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

function montarUrlFoto(req, fotoPerfil) {
  if (!fotoPerfil) return null;

  if (fotoPerfil.startsWith("http")) {
    return fotoPerfil;
  }

  return `${req.protocol}://${req.get("host")}${fotoPerfil}`;
}

function montarUrlImagemPost(req, imagemUrl) {
  if (!imagemUrl) return null;

  if (imagemUrl.startsWith("http")) {
    return imagemUrl;
  }

  if (imagemUrl.startsWith("/uploads")) {
    return `${req.protocol}://${req.get("host")}${imagemUrl}`;
  }

  return `${req.protocol}://${req.get("host")}/uploads/${imagemUrl}`;
}

/* ================================
   LISTAR TODOS OS POSTS
================================ */
exports.getPosts = (req, res) => {
  const authHeader = req.headers.authorization;
  let usuarioId = null;

  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
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
      u.email,
      u.foto_perfil,
      COUNT(DISTINCT l.id) AS likes,
      ${
        usuarioId
          ? `MAX(CASE WHEN l.usuario_id = ${Number(usuarioId)} THEN 1 ELSE 0 END)`
          : `0`
      } AS curtidoPorMim
    FROM posts p
    JOIN users u ON p.usuario_id = u.id
    LEFT JOIN likes l ON l.post_id = p.id
    GROUP BY 
      p.id,
      p.usuario_id,
      p.conteudo,
      p.imagem_url,
      p.data_publicacao,
      u.nome,
      u.email,
      u.foto_perfil
    ORDER BY p.data_publicacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    const posts = results.map((post) => ({
      ...post,
      foto_perfil_url: montarUrlFoto(req, post.foto_perfil),
      imagem_post_url: montarUrlImagemPost(req, post.imagem_url)
    }));

    res.json(posts);
  });
};

/* ================================
   LISTAR MEUS POSTS
================================ */
exports.getMyPosts = (req, res) => {
  const usuarioId = req.user.id;

  const sql = `
    SELECT 
      p.id,
      p.usuario_id,
      p.conteudo,
      p.imagem_url,
      p.data_publicacao,
      u.nome,
      u.email,
      u.foto_perfil,
      COUNT(DISTINCT l.id) AS likes
    FROM posts p
    JOIN users u ON p.usuario_id = u.id
    LEFT JOIN likes l ON l.post_id = p.id
    WHERE p.usuario_id = ?
    GROUP BY 
      p.id,
      p.usuario_id,
      p.conteudo,
      p.imagem_url,
      p.data_publicacao,
      u.nome,
      u.email,
      u.foto_perfil
    ORDER BY p.data_publicacao DESC
  `;

  db.query(sql, [usuarioId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar seus posts",
        detalhes: err.message
      });
    }

    const posts = results.map((post) => ({
      ...post,
      foto_perfil_url: montarUrlFoto(req, post.foto_perfil),
      imagem_post_url: montarUrlImagemPost(req, post.imagem_url)
    }));

    res.json(posts);
  });
};

/* ================================
   CRIAR POST
================================ */
exports.createPost = (req, res) => {
  const { conteudo } = req.body;
  const usuario_id = req.user.id;
  const imagem_url = req.file ? req.file.filename : null;

  if (!conteudo || !conteudo.trim()) {
    return res.status(400).json({
      erro: "O conteúdo do post é obrigatório."
    });
  }

  const sql = `
    INSERT INTO posts 
    (usuario_id, conteudo, imagem_url)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [usuario_id, conteudo.trim(), imagem_url], (err, result) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    res.status(201).json({
      mensagem: "Post criado!",
      id: result.insertId
    });
  });
};

/* ================================
   EDITAR POST
================================ */
exports.updatePost = (req, res) => {
  const { id } = req.params;
  const { conteudo } = req.body;
  const usuario_id = req.user.id;

  if (!conteudo || !conteudo.trim()) {
    return res.status(400).json({
      erro: "O conteúdo do post é obrigatório."
    });
  }

  const verificarSql = `
    SELECT *
    FROM posts
    WHERE id = ?
    AND usuario_id = ?
  `;

  db.query(verificarSql, [id, usuario_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    if (results.length === 0) {
      return res.status(403).json({
        erro: "Você não tem permissão para editar este post."
      });
    }

    const atualizarSql = `
      UPDATE posts
      SET conteudo = ?
      WHERE id = ?
      AND usuario_id = ?
    `;

    db.query(atualizarSql, [conteudo.trim(), id, usuario_id], (errUpdate) => {
      if (errUpdate) {
        return res.status(500).json({
          erro: errUpdate.message
        });
      }

      res.json({
        mensagem: "Post editado com sucesso!",
        post: {
          id: Number(id),
          usuario_id,
          conteudo: conteudo.trim()
        }
      });
    });
  });
};

/* ================================
   DELETAR POST
================================ */
exports.deletePost = (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  db.query("SELECT * FROM posts WHERE id = ?", [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Post não encontrado"
      });
    }

    if (Number(results[0].usuario_id) !== Number(usuario_id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para deletar este post"
      });
    }

    db.query("DELETE FROM posts WHERE id = ?", [id], (err2) => {
      if (err2) {
        return res.status(500).json({
          erro: err2.message
        });
      }

      res.json({
        mensagem: "Post removido!"
      });
    });
  });
};