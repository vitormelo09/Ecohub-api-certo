const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");

const authMiddleware = require("../middlewares/authMiddleware");

/* ================================
   CRIAR DENÚNCIA
   Usuário logado
================================ */
router.post(
  "/",
  authMiddleware,
  reportController.createReport
);

/* ================================
   LISTAR DENÚNCIAS
   Apenas admin geral
================================ */
router.get(
  "/",
  authMiddleware,
  reportController.getReports
);

/* ================================
   ATUALIZAR STATUS DA DENÚNCIA
   Apenas admin geral
================================ */
router.put(
  "/:id/status",
  authMiddleware,
  reportController.updateReportStatus
);

module.exports = router;