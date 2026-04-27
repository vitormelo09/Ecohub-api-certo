const db = require("../config/db");

/* ================================
   LISTAR NOTÍCIAS
================================ */
exports.getNews = (req, res) => {
  const sql = `
    SELECT 
      id,
      titulo,
      resumo,
      conteudo_completo AS conteudo,
      imagem_url AS imagem,
      link,
      categoria,
      data_publicacao,
      criador_id
    FROM news
    ORDER BY data_publicacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar notícias",
        detalhes: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   CRIAR NOTÍCIA
   APENAS ADMIN
================================ */
exports.createNews = (req, res) => {
  const {
    titulo,
    resumo,
    conteudo,
    imagem,
    link,
    categoria,
    data_publicacao
  } = req.body;

  const criador_id = req.user.id;

  if (!titulo || !resumo || !conteudo) {
    return res.status(400).json({
      erro: "Título, resumo e conteúdo são obrigatórios."
    });
  }

  const sql = `
    INSERT INTO news
    (
      titulo,
      resumo,
      conteudo_completo,
      imagem_url,
      link,
      categoria,
      data_publicacao,
      criador_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      titulo,
      resumo,
      conteudo,
      imagem || "",
      link || "#",
      categoria || "Geral",
      data_publicacao || new Date().toISOString().split("T")[0],
      criador_id
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao salvar notícia no banco",
          detalhes: err.message
        });
      }

      res.status(201).json({
        mensagem: "Notícia criada com sucesso!",
        noticia: {
          id: result.insertId,
          titulo,
          resumo,
          conteudo,
          imagem: imagem || "",
          link: link || "#",
          categoria: categoria || "Geral",
          data_publicacao: data_publicacao || new Date().toISOString().split("T")[0],
          criador_id
        }
      });
    }
  );
};

/* ================================
   DELETAR NOTÍCIA
   APENAS ADMIN
================================ */
exports.deleteNews = (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM news
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao excluir notícia",
        detalhes: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: "Notícia não encontrada"
      });
    }

    res.json({
      mensagem: "Notícia excluída com sucesso!"
    });
  });
};