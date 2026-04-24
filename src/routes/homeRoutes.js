const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sqlUsuarios = "SELECT COUNT(*) AS total FROM users";
  const sqlProjetos = "SELECT COUNT(*) AS total FROM projects";
  const sqlEventos = "SELECT COUNT(*) AS total FROM events";
  const sqlNoticias = "SELECT * FROM news LIMIT 3";

  db.query(sqlUsuarios, (errUsuarios, usuariosResult) => {
    if (errUsuarios) {
      console.log("Erro usuários:", errUsuarios);
      return res.status(500).json({
        erro: "Erro ao buscar usuários",
        detalhes: errUsuarios.message
      });
    }

    db.query(sqlProjetos, (errProjetos, projetosResult) => {
      if (errProjetos) {
        console.log("Erro projetos:", errProjetos);
        return res.status(500).json({
          erro: "Erro ao buscar projetos",
          detalhes: errProjetos.message
        });
      }

      db.query(sqlEventos, (errEventos, eventosResult) => {
        if (errEventos) {
          console.log("Erro eventos:", errEventos);
          return res.status(500).json({
            erro: "Erro ao buscar eventos",
            detalhes: errEventos.message
          });
        }

        db.query(sqlNoticias, (errNoticias, noticiasResult) => {
          if (errNoticias) {
            console.log("Erro notícias:", errNoticias);
            return res.status(500).json({
              erro: "Erro ao buscar notícias",
              detalhes: errNoticias.message
            });
          }

          res.json({
            totalAlunos: usuariosResult[0].total,
            totalProjetos: projetosResult[0].total,
            eventosMes: eventosResult[0].total,
            taxaEmpregabilidade: 94,
            noticias: noticiasResult
          });
        });
      });
    });
  });
});

module.exports = router;