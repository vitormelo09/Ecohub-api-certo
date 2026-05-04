const db = require("../config/db");

/* ================================
   LISTAR NOTÍCIAS
================================ */
exports.getNews = (req, res) => {
  const { ordem } = req.query;

  let orderBy = "n.data_publicacao DESC";

  if (ordem === "mais-curtidas") {
    orderBy = "curtidas DESC";
  }

  if (ordem === "mais-novas") {
    orderBy = "n.data_publicacao DESC";
  }

  if (ordem === "mais-antigas") {
    orderBy = "n.data_publicacao ASC";
  }

  const sql = `
    SELECT 
      n.id,
      n.titulo,
      n.resumo,
      n.conteudo_completo AS conteudo,
      n.imagem_url AS imagem,
      n.link,
      n.categoria,
      n.data_publicacao,
      n.criador_id,
      COUNT(nl.id) AS curtidas
    FROM news n
    LEFT JOIN news_likes nl ON nl.news_id = n.id
    GROUP BY 
      n.id,
      n.titulo,
      n.resumo,
      n.conteudo_completo,
      n.imagem_url,
      n.link,
      n.categoria,
      n.data_publicacao,
      n.criador_id
    ORDER BY ${orderBy}
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
    imagem_url,
    link,
    categoria,
    data_publicacao
  } = req.body;

  const criador_id = req.user.id;
  const imagemFinal = imagem_url || imagem;

  if (!titulo || !resumo || !conteudo || !imagemFinal) {
    return res.status(400).json({
      erro: "Título, resumo, conteúdo e imagem são obrigatórios."
    });
  }

  const sql = `
    INSERT INTO news
    (
      titulo,
      resumo,
      conteudo_completo,
      imagem_url,
      imagem,
      link,
      categoria,
      data_publicacao,
      criador_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      titulo,
      resumo,
      conteudo,
      imagemFinal,
      imagemFinal,
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
          imagem: imagemFinal,
          imagem_url: imagemFinal,
          link: link || "#",
          categoria: categoria || "Geral",
          data_publicacao: data_publicacao || new Date().toISOString().split("T")[0],
          criador_id,
          curtidas: 0
        }
      });
    }
  );
};

/* ================================
   CURTIR NOTÍCIA
   USUÁRIO LOGADO
================================ */
exports.likeNews = (req, res) => {
  const news_id = req.params.id;
  const user_id = req.user.id;

  const verificarNoticia = `
    SELECT id
    FROM news
    WHERE id = ?
  `;

  db.query(verificarNoticia, [news_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao verificar notícia",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Notícia não encontrada"
      });
    }

    const sql = `
      INSERT IGNORE INTO news_likes
      (news_id, user_id)
      VALUES (?, ?)
    `;

    db.query(sql, [news_id, user_id], (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao curtir notícia",
          detalhes: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(400).json({
          erro: "Você já curtiu esta notícia."
        });
      }

      res.json({
        mensagem: "Notícia curtida com sucesso!"
      });
    });
  });
};

/* ================================
   REMOVER CURTIDA DA NOTÍCIA
   USUÁRIO LOGADO
================================ */
exports.unlikeNews = (req, res) => {
  const news_id = req.params.id;
  const user_id = req.user.id;

  const sql = `
    DELETE FROM news_likes
    WHERE news_id = ? AND user_id = ?
  `;

  db.query(sql, [news_id, user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao remover curtida",
        detalhes: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        erro: "Você ainda não curtiu esta notícia."
      });
    }

    res.json({
      mensagem: "Curtida removida com sucesso!"
    });
  });
};

/* ================================
   DELETAR NOTÍCIA
   APENAS ADMIN
================================ */
exports.deleteNews = (req, res) => {
  const { id } = req.params;

  const apagarCurtidas = `
    DELETE FROM news_likes
    WHERE news_id = ?
  `;

  db.query(apagarCurtidas, [id], (err) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao remover curtidas da notícia",
        detalhes: err.message
      });
    }

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
  });
};