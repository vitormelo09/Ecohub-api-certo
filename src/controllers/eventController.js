const db = require("../config/db");

exports.getEvents = (req, res) => {
    const sql = "SELECT * FROM events ORDER BY data_evento ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
};

exports.createEvent = (req, res) => {
    const { titulo, descricao, data, local } = req.body;
    
    // Pega o ID do usuário que está no Token (decodificado pelo middleware de auth)
    const criador_id = req.user.id; 

    if (!titulo || !data || !local) {
        return res.status(400).json({ erro: "Título, data e local são obrigatórios." });
    }

    // Incluindo criador_id no INSERT para não dar erro de Foreign Key
    const sql = "INSERT INTO events (titulo, descricao, data_evento, local, criador_id) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [titulo, descricao, data, local, criador_id], (err, result) => {
        if (err) {
            return res.status(500).json({ erro: "Erro ao salvar no banco: " + err.message });
        }
        res.status(201).json({ mensagem: "Evento criado com sucesso!", id: result.insertId });
    });
};

exports.deleteEvent = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM events WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Evento excluído!" });
    });
};