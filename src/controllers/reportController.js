const db = require("../config/db");

/* ================================
   CRIAR DENÚNCIA
================================ */
exports.createReport = (req, res) => {
  const usuarioId = req.user.id;
  const { tipo, referencia_id, motivo, descricao } = req.body;

  const tiposPermitidos = ["post", "projeto"];

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
    [usuarioId, tipo, referencia_id, motivo, descricao || null],
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
      u.nome AS denunciante_nome,
      u.email AS denunciante_email
    FROM reports r
    INNER JOIN users u ON u.id = r.usuario_id
    ORDER BY r.data_criacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao listar denúncias",
        detalhes: err.message
      });
    }

    res.json(results);
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

  const statusPermitidos = ["pendente", "analisado", "removido"];

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