const db = require("../config/db");

exports.getNotifications = (req, res) => {
    const usuario_id = req.user.id;
    const sql = `
        SELECT n.*, u.nome AS remetente_nome 
        FROM notifications n 
        JOIN users u ON n.remetente_id = u.id 
        WHERE n.usuario_id = ? 
        ORDER BY n.data_criacao DESC`;

    db.query(sql, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
};

exports.markAsRead = (req, res) => {
    const usuario_id = req.user.id;
    db.query("UPDATE notifications SET lida = TRUE WHERE usuario_id = ?", [usuario_id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Notificações marcadas como lidas" });
    });
};