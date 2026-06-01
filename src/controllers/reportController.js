const db = require("../config/db");

/* ================================
   MONTAR URL FOTO
================================ */
function montarUrlFoto(req, foto) {
  if (!foto) return null;

  if (String(foto).startsWith("http")) {
    return foto;
  }

  if (String(foto).startsWith("/uploads")) {
    return `${req.protocol}://${req.get("host")}${foto}`;
  }

  if (String(foto).startsWith("uploads")) {
    return `${req.protocol}://${req.get("host")}/${foto}`;
  }

  return null;
}

/* ================================
   CRIAR DENÚNCIA
================================ */
exports.createReport = (req, res) => {
  const usuarioId = req.user.id;
  const { tipo, referencia_id, motivo, descricao } = req.body;

  const tiposPermitidos = [
    "post",
    "projeto",
    "perfil"
  ];

  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({
      erro: "Tipo de denúncia inválido."
    });
  }

  if (!referencia_id || !motivo) {
    return res.status(400).json({
      erro: "Referência e motivo são obrigatórios."
    });
  }

  const sql = `
    INSERT INTO reports
    (usuario_id, tipo, referencia_id, motivo, descricao)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      usuarioId,
      tipo,
      referencia_id,
      motivo,
      descricao || null
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao salvar denúncia",
          detalhes: err.message
        });
      }

      res.status(201).json({
        mensagem: "Denúncia enviada com sucesso.",
        id: result.insertId
      });
    }
  );
};

/* ================================
   LISTAR DENÚNCIAS
   Apenas admin geral
================================ */
exports.getReports = (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({
      erro: "Apenas administradores podem ver denúncias."
    });
  }

  const sql = `
    SELECT
      r.*,

      denunciante.nome AS denunciante_nome,
      denunciante.email AS denunciante_email,
      denunciante.foto_perfil AS denunciante_foto,

      COALESCE(
        usuario_post.nome,
        usuario_projeto.nome,
        usuario_perfil.nome
      ) AS denunciado_nome,

      COALESCE(
        usuario_post.email,
        usuario_projeto.email,
        usuario_perfil.email
      ) AS denunciado_email,

      COALESCE(
        usuario_post.foto_perfil,
        usuario_projeto.foto_perfil,
        usuario_perfil.foto_perfil
      ) AS denunciado_foto,

      posts.conteudo AS post_conteudo,
      projects.titulo AS projeto_titulo

    FROM reports r

    INNER JOIN users denunciante
      ON denunciante.id = r.usuario_id

    LEFT JOIN posts
      ON posts.id = r.referencia_id
      AND r.tipo = 'post'

    LEFT JOIN users usuario_post
      ON usuario_post.id = posts.usuario_id

    LEFT JOIN projects
      ON projects.id = r.referencia_id
      AND r.tipo = 'projeto'

    LEFT JOIN users usuario_projeto
      ON usuario_projeto.id = projects.usuario_id

    LEFT JOIN users usuario_perfil
      ON usuario_perfil.id = r.referencia_id
      AND r.tipo = 'perfil'

    ORDER BY r.data_criacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao listar denúncias",
        detalhes: err.message
      });
    }

    const denuncias = results.map((denuncia) => ({
      ...denuncia,

      denunciante_foto_url: montarUrlFoto(
        req,
        denuncia.denunciante_foto
      ),

      denunciado_foto_url: montarUrlFoto(
        req,
        denuncia.denunciado_foto
      )
    }));

    res.json(denuncias);
  });
};

/* ================================
   ATUALIZAR STATUS
   Apenas admin geral
================================ */
exports.updateReportStatus = (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({
      erro: "Apenas administradores podem atualizar denúncias."
    });
  }

  const reportId = Number(req.params.id);
  const { status } = req.body;

  const statusPermitidos = [
    "pendente",
    "analisado",
    "removido"
  ];

  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({
      erro: "Status inválido."
    });
  }

  const sql = `
    UPDATE reports
    SET status = ?
    WHERE id = ?
  `;

  db.query(sql, [status, reportId], (err, result) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao atualizar denúncia",
        detalhes: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: "Denúncia não encontrada."
      });
    }

    res.json({
      mensagem: "Status da denúncia atualizado com sucesso."
    });
  });
};