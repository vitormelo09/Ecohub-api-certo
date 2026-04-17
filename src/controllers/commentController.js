const db = require("../config/db");

exports.createComment = (req, res) => {
    const { post_id, texto } = req.body;
    const usuario_id = req.user.id;

    if (!post_id || !texto) {
        return res.status(400).json({ erro: "Post ID e texto são obrigatórios." });
    }

    const sql = "INSERT INTO comments (post_id, usuario_id, texto) VALUES (?, ?, ?)";
    db.query(sql, [post_id, usuario_id, texto], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });

        // Notificar o dono do post
        db.query("SELECT usuario_id FROM posts WHERE id = ?", [post_id], (err, post) => {
            if (!err && post.length > 0 && post[0].usuario_id !== usuario_id) {
                const sqlNotify = "INSERT INTO notifications (usuario_id, remetente_id, tipo, post_id) VALUES (?, ?, 'comentario', ?)";
                db.query(sqlNotify, [post[0].usuario_id, usuario_id, post_id]);
            }
        });

        res.status(201).json({ mensagem: "Comentário postado!", id: result.insertId });
    });
};

exports.deleteComment = (req, res) => {
    const { id } = req.params;
    const usuario_id = req.user.id;
    db.query("DELETE FROM comments WHERE id = ? AND usuario_id = ?", [id, usuario_id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Comentário removido!" });
    });
};