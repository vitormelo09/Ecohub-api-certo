const db = require("../config/db");

/* ================================
   LISTAR USUÁRIOS
   APENAS ADMIN
================================ */
exports.listarUsuarios = (req, res) => {
  const sql = `
    SELECT 
      id,
      nome,
      email,
      tipo,
      foto_perfil,
      data_criacao
    FROM users
    ORDER BY nome ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar usuários",
        detalhes: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   ALTERAR TIPO DO USUÁRIO
   APENAS ADMIN
================================ */
exports.alterarTipoUsuario = (req, res) => {
  const { id } = req.params;
  const { tipo } = req.body;

  const tiposPermitidos = ["aluno", "professor", "admin"];

  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({
      erro: "Tipo inválido. Use aluno, professor ou admin."
    });
  }

  if (Number(req.user.id) === Number(id) && tipo !== "admin") {
    return res.status(400).json({
      erro: "Você não pode remover seu próprio admin."
    });
  }

  const sqlVerificar = `
    SELECT id, nome, email, tipo
    FROM users
    WHERE id = ?
  `;

  db.query(sqlVerificar, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao verificar usuário",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado"
      });
    }

    const sqlAtualizar = `
      UPDATE users
      SET tipo = ?
      WHERE id = ?
    `;

    db.query(sqlAtualizar, [tipo, id], (err) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao atualizar usuário",
          detalhes: err.message
        });
      }

      res.json({
        mensagem: "Tipo do usuário atualizado com sucesso!",
        usuario: {
          id: Number(id),
          tipo
        }
      });
    });
  });
};