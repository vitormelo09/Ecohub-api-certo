const db = require("../config/db");

/* ================================
   LISTAR EVENTOS
================================ */
exports.getEvents = (req, res) => {
  const sql = `
    SELECT 
      e.id,
      e.titulo,
      e.descricao,
      e.tipo,
      e.data_evento,
      e.horario,
      e.local,
      e.imagem,
      e.imagem_url,
      e.capacidade,
      e.criador_id,
      e.data_criacao,
      COUNT(ep.id) AS participantes
    FROM events e
    LEFT JOIN event_participants ep ON ep.event_id = e.id
    GROUP BY 
      e.id,
      e.titulo,
      e.descricao,
      e.tipo,
      e.data_evento,
      e.horario,
      e.local,
      e.imagem,
      e.imagem_url,
      e.capacidade,
      e.criador_id,
      e.data_criacao
    ORDER BY e.data_evento ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar eventos",
        detalhes: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   CRIAR EVENTO
   APENAS ADMIN
================================ */
exports.createEvent = (req, res) => {
  const {
    titulo,
    descricao,
    tipo,
    data,
    horario,
    local,
    imagem,
    capacidade
  } = req.body;

  const criador_id = req.user.id;

  if (!titulo || !data || !local) {
    return res.status(400).json({
      erro: "Título, data e local são obrigatórios."
    });
  }

  const sql = `
    INSERT INTO events 
    (
      titulo,
      descricao,
      tipo,
      data_evento,
      horario,
      local,
      imagem,
      capacidade,
      criador_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      titulo,
      descricao || "",
      tipo || "Evento",
      data,
      horario || "",
      local,
      imagem || "",
      capacidade || "",
      criador_id
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao salvar evento no banco",
          detalhes: err.message
        });
      }

      res.status(201).json({
        mensagem: "Evento criado com sucesso!",
        evento: {
          id: result.insertId,
          titulo,
          descricao: descricao || "",
          tipo: tipo || "Evento",
          data_evento: data,
          horario: horario || "",
          local,
          imagem: imagem || "",
          capacidade: capacidade || "",
          criador_id,
          participantes: 0
        }
      });
    }
  );
};

/* ================================
   CONFIRMAR PRESENÇA
================================ */
exports.confirmarPresenca = (req, res) => {
  const event_id = req.params.id;
  const user_id = req.user.id;

  const verificarEvento = `
    SELECT id
    FROM events
    WHERE id = ?
  `;

  db.query(verificarEvento, [event_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao verificar evento",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Evento não encontrado"
      });
    }

    const sql = `
      INSERT IGNORE INTO event_participants
      (event_id, user_id)
      VALUES (?, ?)
    `;

    db.query(sql, [event_id, user_id], (err) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao confirmar presença",
          detalhes: err.message
        });
      }

      res.json({
        mensagem: "Presença confirmada com sucesso!"
      });
    });
  });
};

/* ================================
   CANCELAR PRESENÇA
================================ */
exports.cancelarPresenca = (req, res) => {
  const event_id = req.params.id;
  const user_id = req.user.id;

  const sql = `
    DELETE FROM event_participants
    WHERE event_id = ? AND user_id = ?
  `;

  db.query(sql, [event_id, user_id], (err) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao cancelar presença",
        detalhes: err.message
      });
    }

    res.json({
      mensagem: "Presença cancelada com sucesso!"
    });
  });
};

/* ================================
   LISTAR MEUS EVENTOS
================================ */
exports.getMeusEventos = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT 
      e.id,
      e.titulo,
      e.descricao,
      e.tipo,
      e.data_evento,
      e.horario,
      e.local,
      e.imagem,
      e.imagem_url,
      e.capacidade,
      e.criador_id,
      e.data_criacao,
      p.data_confirmacao,
      (
        SELECT COUNT(*)
        FROM event_participants ep
        WHERE ep.event_id = e.id
      ) AS participantes
    FROM event_participants p
    INNER JOIN events e ON e.id = p.event_id
    WHERE p.user_id = ?
    ORDER BY e.data_evento ASC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar seus eventos",
        detalhes: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   DELETAR EVENTO
   APENAS ADMIN
================================ */
exports.deleteEvent = (req, res) => {
  const { id } = req.params;

  const apagarParticipantes = `
    DELETE FROM event_participants
    WHERE event_id = ?
  `;

  db.query(apagarParticipantes, [id], (err) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao remover participantes do evento",
        detalhes: err.message
      });
    }

    const apagarEvento = `
      DELETE FROM events
      WHERE id = ?
    `;

    db.query(apagarEvento, [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao excluir evento",
          detalhes: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          erro: "Evento não encontrado"
        });
      }

      res.json({
        mensagem: "Evento excluído com sucesso!"
      });
    });
  });
};