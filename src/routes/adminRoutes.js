const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

/* ================================
   LISTAR USUÁRIOS
   Apenas admin
================================ */
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.listarUsuarios
);

/* ================================
   ALTERAR TIPO DO USUÁRIO
   Apenas admin
================================ */
router.put(
  "/users/:id/tipo",
  authMiddleware,
  adminMiddleware,
  adminController.alterarTipoUsuario
);

module.exports = router;