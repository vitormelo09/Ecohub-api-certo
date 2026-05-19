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
      e.confirmados,
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
      e.confirmados,
      e.criador_id,
      e.data_criacao
    ORDER BY e.data_evento ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log("ERRO MYSQL AO BUSCAR EVENTOS:", err);

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
================================ */
exports.createEvent = (req, res) => {
  console.log("CHEGOU NO CREATE EVENT");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);
  console.log("USER:", req.user);

  const {
    titulo,
    descricao,
    tipo,
    data,
    data_evento,
    horario,
    local,
    capacidade
  } = req.body;

  const dataFinal = data || data_evento;

  const imagemFinal = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : null;

  if (!titulo || !dataFinal || !local || !imagemFinal || !capacidade) {
    console.log("DADOS OBRIGATÓRIOS FALTANDO:", {
      titulo,
      dataFinal,
      local,
      imagemFinal,
      capacidade
    });

    return res.status(400).json({
      erro: "Título, data, local, imagem e capacidade são obrigatórios."
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
      imagem_url,
      capacidade,
      confirmados,
      criador_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `;

  db.query(
    sql,
    [
      titulo,
      descricao || "",
      tipo || "Evento",
      dataFinal,
      horario || "",
      local,
      imagemFinal,
      imagemFinal,
      capacidade,
      null
    ],
    (err, result) => {
      if (err) {
        console.log("ERRO MYSQL AO SALVAR EVENTO:", err);

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
          data_evento: dataFinal,
          horario: horario || "",
          local,
          imagem: imagemFinal,
          imagem_url: imagemFinal,
          capacidade,
          confirmados: 0,
          criador_id: null,
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
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({
      erro: "Usuário não autenticado."
    });
  }

  const verificarEvento = `
    SELECT id, capacidade, confirmados
    FROM events
    WHERE id = ?
  `;

  db.query(verificarEvento, [event_id], (err, results) => {
    if (err) {
      console.log("ERRO MYSQL AO VERIFICAR EVENTO:", err);

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

    const evento = results[0];

    if (evento.confirmados >= evento.capacidade) {
      return res.status(400).json({
        erro: "Evento lotado."
      });
    }

    const verificarParticipante = `
      SELECT id
      FROM event_participants
      WHERE event_id = ? AND user_id = ?
    `;

    db.query(verificarParticipante, [event_id, user_id], (err, participantes) => {
      if (err) {
        console.log("ERRO MYSQL AO VERIFICAR PARTICIPANTE:", err);

        return res.status(500).json({
          erro: "Erro ao verificar participante",
          detalhes: err.message
        });
      }

      if (participantes.length > 0) {
        return res.status(400).json({
          erro: "Você já confirmou presença neste evento."
        });
      }

      const inserirParticipante = `
        INSERT INTO event_participants
        (event_id, user_id)
        VALUES (?, ?)
      `;

      db.query(inserirParticipante, [event_id, user_id], (err) => {
        if (err) {
          console.log("ERRO MYSQL AO INSERIR PARTICIPANTE:", err);

          return res.status(500).json({
            erro: "Erro ao confirmar presença",
            detalhes: err.message
          });
        }

        const atualizarEvento = `
          UPDATE events
          SET confirmados = confirmados + 1
          WHERE id = ?
        `;

        db.query(atualizarEvento, [event_id], (err) => {
          if (err) {
            console.log("ERRO MYSQL AO ATUALIZAR CONFIRMADOS:", err);

            return res.status(500).json({
              erro: "Erro ao atualizar contador",
              detalhes: err.message
            });
          }

          res.json({
            mensagem: "Presença confirmada com sucesso!"
          });
        });
      });
    });
  });
};

/* ================================
   CANCELAR PRESENÇA
================================ */
exports.cancelarPresenca = (req, res) => {
  const event_id = req.params.id;
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({
      erro: "Usuário não autenticado."
    });
  }

  const verificarParticipante = `
    SELECT id
    FROM event_participants
    WHERE event_id = ? AND user_id = ?
  `;

  db.query(verificarParticipante, [event_id, user_id], (err, results) => {
    if (err) {
      console.log("ERRO MYSQL AO VERIFICAR PRESENÇA:", err);

      return res.status(500).json({
        erro: "Erro ao verificar presença",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(400).json({
        erro: "Você não confirmou presença neste evento."
      });
    }

    const removerParticipante = `
      DELETE FROM event_participants
      WHERE event_id = ? AND user_id = ?
    `;

    db.query(removerParticipante, [event_id, user_id], (err) => {
      if (err) {
        console.log("ERRO MYSQL AO CANCELAR PRESENÇA:", err);

        return res.status(500).json({
          erro: "Erro ao cancelar presença",
          detalhes: err.message
        });
      }

      const atualizarEvento = `
        UPDATE events
        SET confirmados = GREATEST(confirmados - 1, 0)
        WHERE id = ?
      `;

      db.query(atualizarEvento, [event_id], (err) => {
        if (err) {
          console.log("ERRO MYSQL AO ATUALIZAR CONTADOR:", err);

          return res.status(500).json({
            erro: "Erro ao atualizar contador",
            detalhes: err.message
          });
        }

        res.json({
          mensagem: "Presença cancelada com sucesso!"
        });
      });
    });
  });
};

/* ================================
   LISTAR MEUS EVENTOS
================================ */
exports.getMeusEventos = (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({
      erro: "Usuário não autenticado."
    });
  }

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
      e.confirmados,
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
      console.log("ERRO MYSQL AO BUSCAR MEUS EVENTOS:", err);

      return res.status(500).json({
        erro: "Erro ao buscar seus eventos",
        detalhes: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   EDITAR EVENTO
================================ */
exports.updateEvent = (req, res) => {
  const { id } = req.params;

  const {
    titulo,
    descricao,
    tipo,
    data,
    data_evento,
    horario,
    local,
    capacidade
  } = req.body;

  const dataFinal = data || data_evento;

  if (!titulo || !dataFinal || !local || !capacidade) {
    return res.status(400).json({
      erro: "Título, data, local e capacidade são obrigatórios."
    });
  }

  const buscarEvento = `
    SELECT imagem, imagem_url
    FROM events
    WHERE id = ?
  `;

  db.query(buscarEvento, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar evento",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Evento não encontrado"
      });
    }

    const imagemAtual = results[0].imagem_url || results[0].imagem;

    const imagemFinal = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : imagemAtual;

    const sql = `
      UPDATE events
      SET
        titulo = ?,
        descricao = ?,
        tipo = ?,
        data_evento = ?,
        horario = ?,
        local = ?,
        imagem = ?,
        imagem_url = ?,
        capacidade = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        titulo,
        descricao || "",
        tipo || "Evento",
        dataFinal,
        horario || "",
        local,
        imagemFinal,
        imagemFinal,
        capacidade,
        id
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            erro: "Erro ao atualizar evento",
            detalhes: err.message
          });
        }

        res.json({
          mensagem: "Evento atualizado com sucesso!"
        });
      }
    );
  });
};

/* ================================
   DELETAR EVENTO
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
        erro: "Erro ao remover participantes",
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

      res.json({
        mensagem: "Evento excluído com sucesso!"
      });
    });
  });
};