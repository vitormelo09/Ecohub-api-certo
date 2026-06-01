const db = require("../config/db");

/* ================================
   MONTAR URL DA IMAGEM
================================ */
function montarUrlImagem(req, imagem) {
  if (!imagem) return null;

  if (imagem.startsWith("http")) {
    return imagem;
  }

  return `${req.protocol}://${req.get("host")}${imagem}`;
}

/* ================================
   VERIFICAR ADMIN DE PROJETOS
================================ */
function podeAvaliarProjetos(req) {
  return (
    req.user &&
    (
      req.user.tipo === "admin" ||
      req.user.tipo === "admin_projetos"
    )
  );
}

/* ================================
   LISTAR TODOS OS PROJETOS APROVADOS
================================ */
exports.getProjects = (req, res) => {
  const ordem = req.query.ordem || "recentes";

  let orderBy = `
    ORDER BY 
      p.destaque DESC,
      p.data_criacao DESC
  `;

  if (ordem === "antigos") {
    orderBy = `
      ORDER BY 
        p.destaque DESC,
        p.data_criacao ASC
    `;
  }

  if (ordem === "curtidos") {
    orderBy = `
      ORDER BY 
        p.destaque DESC,
        curtidas DESC,
        p.data_criacao DESC
    `;
  }

  const sql = `
    SELECT 
      p.*,
      u.nome AS autor_nome,
      COALESCE(l.total_curtidas, 0) AS curtidas
    FROM projects p
    LEFT JOIN users u ON u.id = p.usuario_id
    LEFT JOIN (
      SELECT 
        project_id, 
        COUNT(*) AS total_curtidas
      FROM project_likes
      GROUP BY project_id
    ) l ON l.project_id = p.id
    WHERE p.status = 'aprovado'
    ${orderBy}
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar projetos",
        detalhes: err.message
      });
    }

    res.json(results.map(project => ({
      ...project,
      imagem_url: montarUrlImagem(req, project.imagem_url || project.imagem)
    })));
  });
};

/* ================================
   LISTAR MEUS PROJETOS
================================ */
exports.getMyProjects = (req, res) => {
  const usuario_id = req.user.id;
  const ordem = req.query.ordem || "recentes";

  let orderBy = `
    ORDER BY 
      p.destaque DESC,
      p.data_criacao DESC
  `;

  if (ordem === "antigos") {
    orderBy = `
      ORDER BY 
        p.destaque DESC,
        p.data_criacao ASC
    `;
  }

  if (ordem === "curtidos") {
    orderBy = `
      ORDER BY 
        p.destaque DESC,
        curtidas DESC,
        p.data_criacao DESC
    `;
  }

  const sql = `
    SELECT 
      p.*,
      u.nome AS autor_nome,
      COALESCE(l.total_curtidas, 0) AS curtidas
    FROM projects p
    LEFT JOIN users u ON u.id = p.usuario_id
    LEFT JOIN (
      SELECT 
        project_id, 
        COUNT(*) AS total_curtidas
      FROM project_likes
      GROUP BY project_id
    ) l ON l.project_id = p.id
    WHERE p.usuario_id = ?
    ${orderBy}
  `;

  db.query(sql, [usuario_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar seus projetos",
        detalhes: err.message
      });
    }

    res.json(results.map(project => ({
      ...project,
      imagem_url: montarUrlImagem(req, project.imagem_url || project.imagem)
    })));
  });
};

/* ================================
   LISTAR PROJETOS PENDENTES
   admin / admin_projetos
================================ */
exports.getProjetosPendentes = (req, res) => {
  if (!podeAvaliarProjetos(req)) {
    return res.status(403).json({
      erro: "Apenas admin geral ou admin de projetos pode ver projetos pendentes."
    });
  }

  const sql = `
    SELECT
      p.*,
      u.nome AS autor_nome,
      u.email AS autor_email
    FROM projects p
    LEFT JOIN users u ON u.id = p.usuario_id
    WHERE p.status = 'pendente'
    ORDER BY p.data_criacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar projetos pendentes",
        detalhes: err.message
      });
    }

    res.json(results.map(project => ({
      ...project,
      imagem_url: montarUrlImagem(req, project.imagem_url || project.imagem)
    })));
  });
};

/* ================================
   CRIAR PROJETO
   imagem obrigatória
   status: pendente
================================ */
exports.createProject = (req, res) => {
  const {
    titulo,
    descricao,
    link_github,
    tecnologias_usadas,
    tecnologias
  } = req.body;

  const usuario_id = req.user.id;

  if (!titulo || !descricao) {
    return res.status(400).json({
      erro: "Título e descrição são obrigatórios."
    });
  }

  if (!req.file) {
    return res.status(400).json({
      erro: "A imagem do projeto é obrigatória."
    });
  }

  const caminhoArquivo = req.file.path.replace(/\\/g, "/");
  const indexUploads = caminhoArquivo.indexOf("uploads/");
  const caminhoPublico = "/" + caminhoArquivo.substring(indexUploads);

  const imagem = caminhoPublico;
  const imagem_url = caminhoPublico;

  const sql = `
    INSERT INTO projects 
    (
      titulo, 
      descricao, 
      link_github, 
      tecnologias_usadas,
      tecnologias,
      usuario_id, 
      imagem,
      imagem_url,
      destaque,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'pendente')
  `;

  db.query(
    sql,
    [
      titulo,
      descricao,
      link_github || "",
      tecnologias_usadas || tecnologias || "",
      tecnologias || tecnologias_usadas || "",
      usuario_id,
      imagem,
      imagem_url
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao criar projeto",
          detalhes: err.message
        });
      }

      res.status(201).json({
        mensagem: "Projeto enviado para avaliação! Ele aparecerá no site após aprovação.",
        projeto: {
          id: result.insertId,
          titulo,
          descricao,
          link_github: link_github || "",
          tecnologias_usadas: tecnologias_usadas || tecnologias || "",
          tecnologias: tecnologias || tecnologias_usadas || "",
          usuario_id,
          imagem,
          imagem_url: montarUrlImagem(req, imagem_url),
          destaque: 0,
          status: "pendente",
          curtidas: 0
        }
      });
    }
  );
};

/* ================================
   APROVAR PROJETO
================================ */
exports.aprovarProjeto = (req, res) => {
  if (!podeAvaliarProjetos(req)) {
    return res.status(403).json({
      erro: "Apenas admin geral ou admin de projetos pode aprovar projetos."
    });
  }

  const projetoId = Number(req.params.id);
  const adminId = req.user.id;

  if (!projetoId) {
    return res.status(400).json({
      erro: "ID do projeto é obrigatório."
    });
  }

  const sql = `
    UPDATE projects
    SET 
      status = 'aprovado',
      motivo_rejeicao = NULL,
      aprovado_por = ?,
      data_aprovacao = NOW()
    WHERE id = ?
  `;

  db.query(sql, [adminId, projetoId], (err, result) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao aprovar projeto",
        detalhes: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: "Projeto não encontrado."
      });
    }

    res.json({
      mensagem: "Projeto aprovado com sucesso!",
      projetoId
    });
  });
};

/* ================================
   REJEITAR PROJETO
================================ */
exports.rejeitarProjeto = (req, res) => {
  if (!podeAvaliarProjetos(req)) {
    return res.status(403).json({
      erro: "Apenas admin geral ou admin de projetos pode rejeitar projetos."
    });
  }

  const projetoId = Number(req.params.id);
  const { motivo } = req.body;

  if (!projetoId) {
    return res.status(400).json({
      erro: "ID do projeto é obrigatório."
    });
  }

  const sql = `
    UPDATE projects
    SET 
      status = 'rejeitado',
      motivo_rejeicao = ?,
      aprovado_por = NULL,
      data_aprovacao = NULL
    WHERE id = ?
  `;

  db.query(sql, [motivo || "Projeto rejeitado pelo administrador.", projetoId], (err, result) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao rejeitar projeto",
        detalhes: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: "Projeto não encontrado."
      });
    }

    res.json({
      mensagem: "Projeto rejeitado com sucesso!",
      projetoId,
      motivo: motivo || "Projeto rejeitado pelo administrador."
    });
  });
};

/* ================================
   CURTIR / REMOVER CURTIDA
================================ */
exports.toggleProjectLike = (req, res) => {
  const projectId = Number(req.params.id);
  const usuarioId = req.user.id;

  if (!projectId) {
    return res.status(400).json({
      erro: "ID do projeto é obrigatório."
    });
  }

  const verificarProjetoSql = `
    SELECT id, status
    FROM projects
    WHERE id = ?
  `;

  db.query(verificarProjetoSql, [projectId], (errProjeto, projetoResults) => {
    if (errProjeto) {
      return res.status(500).json({
        erro: "Erro ao verificar projeto",
        detalhes: errProjeto.message
      });
    }

    if (projetoResults.length === 0) {
      return res.status(404).json({
        erro: "Projeto não encontrado."
      });
    }

    if (projetoResults[0].status !== "aprovado") {
      return res.status(403).json({
        erro: "Você só pode curtir projetos aprovados."
      });
    }

    const verificarSql = `
      SELECT id 
      FROM project_likes 
      WHERE project_id = ? 
      AND usuario_id = ?
    `;

    db.query(verificarSql, [projectId, usuarioId], (err, results) => {
      if (err) {
        return res.status(500).json({
          erro: err.message
        });
      }

      if (results.length > 0) {
        const deleteSql = `
          DELETE FROM project_likes 
          WHERE project_id = ? 
          AND usuario_id = ?
        `;

        db.query(deleteSql, [projectId, usuarioId], (errDelete) => {
          if (errDelete) {
            return res.status(500).json({
              erro: errDelete.message
            });
          }

          buscarTotalCurtidas(projectId, res, false);
        });

        return;
      }

      const insertSql = `
        INSERT INTO project_likes 
        (project_id, usuario_id)
        VALUES (?, ?)
      `;

      db.query(insertSql, [projectId, usuarioId], (errInsert) => {
        if (errInsert) {
          return res.status(500).json({
            erro: errInsert.message
          });
        }

        buscarTotalCurtidas(projectId, res, true);
      });
    });
  });
};

function buscarTotalCurtidas(projectId, res, curtido) {
  const sql = `
    SELECT COUNT(*) AS curtidas
    FROM project_likes
    WHERE project_id = ?
  `;

  db.query(sql, [projectId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    res.json({
      mensagem: curtido ? "Projeto curtido!" : "Curtida removida!",
      curtido,
      curtidas: results[0].curtidas
    });
  });
}

/* ================================
   DESTACAR / REMOVER DESTAQUE
================================ */
exports.toggleProjectDestaque = (req, res) => {
  const projectId = Number(req.params.id);
  const usuarioId = req.user.id;

  if (!projectId) {
    return res.status(400).json({
      erro: "ID do projeto é obrigatório."
    });
  }

  const verificarSql = `
    SELECT id, usuario_id, destaque, status
    FROM projects
    WHERE id = ?
  `;

  db.query(verificarSql, [projectId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao verificar projeto",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Projeto não encontrado."
      });
    }

    const projeto = results[0];

    if (Number(projeto.usuario_id) !== Number(usuarioId)) {
      return res.status(403).json({
        erro: "Você não tem permissão para destacar este projeto."
      });
    }

    if (projeto.status !== "aprovado") {
      return res.status(403).json({
        erro: "Você só pode destacar projetos aprovados."
      });
    }

    const novoDestaque = projeto.destaque ? 0 : 1;

    const updateSql = `
      UPDATE projects
      SET destaque = ?
      WHERE id = ?
      AND usuario_id = ?
    `;

    db.query(updateSql, [novoDestaque, projectId, usuarioId], (errUpdate) => {
      if (errUpdate) {
        return res.status(500).json({
          erro: "Erro ao atualizar destaque",
          detalhes: errUpdate.message
        });
      }

      res.json({
        mensagem: novoDestaque
          ? "Projeto destacado com sucesso!"
          : "Destaque removido com sucesso!",
        destaque: novoDestaque
      });
    });
  });
};

/* ================================
   DELETAR PROJETO
================================ */
exports.deleteProject = (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  const sqlVerificar = `
    SELECT usuario_id 
    FROM projects 
    WHERE id = ?
  `;

  db.query(sqlVerificar, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao verificar projeto",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Projeto não encontrado"
      });
    }

    const donoProjeto = results[0].usuario_id;

    if (Number(donoProjeto) !== Number(usuario_id) && !podeAvaliarProjetos(req)) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir este projeto"
      });
    }

    const sqlExcluir = `
      DELETE FROM projects 
      WHERE id = ?
    `;

    db.query(sqlExcluir, [id], (errDelete) => {
      if (errDelete) {
        return res.status(500).json({
          erro: "Erro ao excluir projeto",
          detalhes: errDelete.message
        });
      }

      res.json({
        mensagem: "Projeto removido com sucesso!"
      });
    });
  });
};