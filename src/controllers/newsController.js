const db = require("../config/db");

exports.getNews = (req, res) => {
    const sql = "SELECT * FROM news ORDER BY data_publicacao DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
};

exports.createNews = (req, res) => {
    // O banco exige 'resumo' e 'conteudo_completo'
    const { titulo, resumo, conteudo, imagem_url } = req.body;

    if (!titulo || !resumo || !conteudo) {
        return res.status(400).json({ 
            erro: "Campos obrigatórios faltando: titulo, resumo e conteudo." 
        });
    }

    // 'conteudo_completo' é como a coluna chama no seu SQL
    const sql = "INSERT INTO news (titulo, resumo, conteudo_completo, imagem_url) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [titulo, resumo, conteudo, imagem_url || null], (err, result) => {
        if (err) {
            return res.status(500).json({ erro: "Erro no banco: " + err.message });
        }
        res.status(201).json({ mensagem: "Notícia publicada!", id: result.insertId });
    });
};

exports.deleteNews = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM news WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Notícia deletada!" });
    });
};