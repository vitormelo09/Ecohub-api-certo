const db = require("../config/db");

exports.toggleLike = (req, res) => {
  const { post_id } = req.body;
  const usuario_id = req.user.id;

  if (!post_id) {
    return res.status(400).json({ erro: "post_id é obrigatório" });
  }

  const sqlCheck = "SELECT id FROM likes WHERE post_id = ? AND usuario_id = ?";

  db.query(sqlCheck, [post_id, usuario_id], (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });

    if (results.length > 0) {
      db.query(
        "DELETE FROM likes WHERE post_id = ? AND usuario_id = ?",
        [post_id, usuario_id],
        (deleteErr) => {
          if (deleteErr) return res.status(500).json({ erro: deleteErr.message });

          db.query(
            "SELECT COUNT(*) AS totalCurtidas FROM likes WHERE post_id = ?",
            [post_id],
            (countErr, countResults) => {
              if (countErr) return res.status(500).json({ erro: countErr.message });

              res.json({
                mensagem: "Curtida removida",
                curtidoPorMim: false,
                totalCurtidas: countResults[0].totalCurtidas
              });
            }
          );
        }
      );
    } else {
      db.query(
        "INSERT INTO likes (post_id, usuario_id) VALUES (?, ?)",
        [post_id, usuario_id],
        (insertErr) => {
          if (insertErr) return res.status(500).json({ erro: insertErr.message });

          db.query("SELECT usuario_id FROM posts WHERE id = ?", [post_id], (postErr, post) => {
            if (!postErr && post.length > 0 && post[0].usuario_id !== usuario_id) {
              const sqlNotify = `
                INSERT INTO notifications (usuario_id, remetente_id, tipo, post_id)
                VALUES (?, ?, 'curtida', ?)
              `;
              db.query(sqlNotify, [post[0].usuario_id, usuario_id, post_id]);
            }
          });

          db.query(
            "SELECT COUNT(*) AS totalCurtidas FROM likes WHERE post_id = ?",
            [post_id],
            (countErr, countResults) => {
              if (countErr) return res.status(500).json({ erro: countErr.message });

              res.status(201).json({
                mensagem: "Post curtido!",
                curtidoPorMim: true,
                totalCurtidas: countResults[0].totalCurtidas
              });
            }
          );
        }
      );
    }
  });
};