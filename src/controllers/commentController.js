const db = require("../config/db");

/* ================================
   LISTAR COMENTÁRIOS DE UM POST
================================ */
exports.getCommentsByPost = (req, res) => {
  const { postId } = req.params;
  const usuarioLogadoId = req.user.id;

  if (!postId) {
    return res.status(400).json({ erro: "ID do post é obrigatório." });
  }

  const sql = `
    SELECT 
      c.id,
      c.post_id,
      c.usuario_id,
      c.texto,
      c.data_criacao,
      u.nome,
      u.email,
      COUNT(cl.id) AS likes,
      CASE 
        WHEN meu_like.id IS NULL THEN 0
        ELSE 1
      END AS curtidoPorMim
    FROM comments c
    JOIN users u ON c.usuario_id = u.id
    LEFT JOIN comment_likes cl ON cl.comentario_id = c.id
    LEFT JOIN comment_likes meu_like 
      ON meu_like.comentario_id = c.id 
      AND meu_like.usuario_id = ?
    WHERE c.post_id = ?
    GROUP BY 
      c.id,
      c.post_id,
      c.usuario_id,
      c.texto,
      c.data_criacao,
      u.nome,
      u.email,
      meu_like.id
    ORDER BY c.data_criacao ASC
  `;

  db.query(sql, [usuarioLogadoId, postId], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json(results);
  });
};

/* ================================
   CRIAR COMENTÁRIO
================================ */
exports.createComment = (req, res) => {
  const { post_id, texto } = req.body;
  const usuario_id = req.user.id;

  if (!post_id || !texto || !texto.trim()) {
    return res.status(400).json({
      erro: "Post ID e texto são obrigatórios."
    });
  }

  const sql = `
    INSERT INTO comments (post_id, usuario_id, texto)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [post_id, usuario_id, texto.trim()], (err, result) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    db.query(
      "SELECT usuario_id FROM posts WHERE id = ?",
      [post_id],
      (errPost, post) => {
        if (!errPost && post.length > 0 && Number(post[0].usuario_id) !== Number(usuario_id)) {
          const sqlNotify = `
            INSERT INTO notifications 
            (usuario_id, remetente_id, tipo, post_id) 
            VALUES (?, ?, 'comentario', ?)
          `;

          db.query(sqlNotify, [post[0].usuario_id, usuario_id, post_id]);
        }
      }
    );

    const comentarioCriado = {
      id: result.insertId,
      post_id,
      usuario_id,
      texto: texto.trim(),
      data_criacao: new Date(),
      likes: 0,
      curtidoPorMim: 0
    };

    res.status(201).json({
      mensagem: "Comentário postado!",
      comentario: comentarioCriado
    });
  });
};

/* ================================
   CURTIR / DESCURTIR COMENTÁRIO
================================ */
exports.toggleLikeComentario = (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  if (!id) {
    return res.status(400).json({
      erro: "ID do comentário é obrigatório."
    });
  }

  const verificarComentarioSql = `
    SELECT id FROM comments
    WHERE id = ?
  `;

  db.query(verificarComentarioSql, [id], (errComentario, comentario) => {
    if (errComentario) {
      return res.status(500).json({ erro: errComentario.message });
    }

    if (comentario.length === 0) {
      return res.status(404).json({
        erro: "Comentário não encontrado."
      });
    }

    const verificarLikeSql = `
      SELECT id FROM comment_likes
      WHERE comentario_id = ? AND usuario_id = ?
    `;

    db.query(verificarLikeSql, [id, usuario_id], (errLike, likes) => {
      if (errLike) {
        return res.status(500).json({ erro: errLike.message });
      }

      if (likes.length > 0) {
        const deletarLikeSql = `
          DELETE FROM comment_likes
          WHERE comentario_id = ? AND usuario_id = ?
        `;

        db.query(deletarLikeSql, [id, usuario_id], (errDelete) => {
          if (errDelete) {
            return res.status(500).json({ erro: errDelete.message });
          }

          contarLikesComentario(id, false, res);
        });
      } else {
        const inserirLikeSql = `
          INSERT INTO comment_likes (comentario_id, usuario_id)
          VALUES (?, ?)
        `;

        db.query(inserirLikeSql, [id, usuario_id], (errInsert) => {
          if (errInsert) {
            return res.status(500).json({ erro: errInsert.message });
          }

          contarLikesComentario(id, true, res);
        });
      }
    });
  });
};

function contarLikesComentario(comentarioId, curtidoPorMim, res) {
  const contarSql = `
    SELECT COUNT(*) AS totalCurtidas
    FROM comment_likes
    WHERE comentario_id = ?
  `;

  db.query(contarSql, [comentarioId], (errTotal, total) => {
    if (errTotal) {
      return res.status(500).json({ erro: errTotal.message });
    }

    res.json({
      mensagem: curtidoPorMim ? "Comentário curtido!" : "Curtida removida!",
      curtidoPorMim,
      totalCurtidas: total[0].totalCurtidas
    });
  });
}

/* ================================
   EDITAR COMENTÁRIO
================================ */
exports.updateComment = (req, res) => {
  const { id } = req.params;
  const { texto } = req.body;
  const usuario_id = req.user.id;

  if (!texto || !texto.trim()) {
    return res.status(400).json({
      erro: "O comentário não pode ficar vazio."
    });
  }

  const verificarSql = `
    SELECT * FROM comments 
    WHERE id = ? AND usuario_id = ?
  `;

  db.query(verificarSql, [id, usuario_id], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({
        erro: "Você não tem permissão para editar este comentário."
      });
    }

    const atualizarSql = `
      UPDATE comments 
      SET texto = ?
      WHERE id = ? AND usuario_id = ?
    `;

    db.query(atualizarSql, [texto.trim(), id, usuario_id], (errUpdate) => {
      if (errUpdate) {
        return res.status(500).json({ erro: errUpdate.message });
      }

      res.json({
        mensagem: "Comentário editado com sucesso!",
        comentario: {
          id: Number(id),
          usuario_id,
          texto: texto.trim()
        }
      });
    });
  });
};

/* ================================
   DELETAR COMENTÁRIO
================================ */
exports.deleteComment = (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  const verificarSql = `
    SELECT * FROM comments 
    WHERE id = ? AND usuario_id = ?
  `;

  db.query(verificarSql, [id, usuario_id], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir este comentário."
      });
    }

    const deletarSql = `
      DELETE FROM comments 
      WHERE id = ? AND usuario_id = ?
    `;

    db.query(deletarSql, [id, usuario_id], (errDelete) => {
      if (errDelete) {
        return res.status(500).json({ erro: errDelete.message });
      }

      res.json({
        mensagem: "Comentário removido!"
      });
    });
  });
};