const db = require("../config/db");

exports.getProjects = (req, res) => {
    const sql = "SELECT * FROM projects ORDER BY data_criacao DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
};

exports.createProject = (req, res) => {
    const { titulo, descricao, link_github, tecnologias_usadas } = req.body;
    const usuario_id = req.user.id;
    const sql = "INSERT INTO projects (titulo, descricao, link_github, tecnologias_usadas, usuario_id) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [titulo, descricao, link_github, tecnologias_usadas, usuario_id], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.status(201).json({ mensagem: "Projeto criado!", id: result.insertId });
    });
};

exports.deleteProject = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM projects WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Projeto removido!" });
    });
};