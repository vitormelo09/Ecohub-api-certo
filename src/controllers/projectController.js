const db = require("../config/db");

/* ================================
   LISTAR TODOS OS PROJETOS
================================ */
exports.getProjects = (req, res) => {
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
    ORDER BY curtidas DESC, p.data_criacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   LISTAR MEUS PROJETOS
================================ */
exports.getMyProjects = (req, res) => {
  const usuario_id = req.user.id;

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
    ORDER BY p.data_criacao DESC
  `;

  db.query(sql, [usuario_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar seus projetos",
        detalhes: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   CRIAR PROJETO
================================ */
exports.createProject = (req, res) => {
  const { titulo, descricao, link_github, tecnologias_usadas } = req.body;
  const usuario_id = req.user.id;

  if (!titulo || !descricao) {
    return res.status(400).json({
      erro: "Título e descrição são obrigatórios."
    });
  }

  let imagem = null;

  if (req.file) {
    imagem = `/uploads/${req.file.filename}`;
  }

  const sql = `
    INSERT INTO projects 
    (titulo, descricao, link_github, tecnologias_usadas, usuario_id, imagem)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      titulo,
      descricao,
      link_github || "",
      tecnologias_usadas || "",
      usuario_id,
      imagem
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: err.message
        });
      }

      res.status(201).json({
        mensagem: "Projeto criado!",
        id: result.insertId,
        imagem
      });
    }
  );
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

    if (Number(donoProjeto) !== Number(usuario_id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir este projeto"
      });
    }

    const sqlExcluir = `
      DELETE FROM projects 
      WHERE id = ? 
      AND usuario_id = ?
    `;

    db.query(sqlExcluir, [id, usuario_id], (errDelete) => {
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