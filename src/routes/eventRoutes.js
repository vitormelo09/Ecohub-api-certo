const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

/* ================================
   LISTAR EVENTOS
   Qualquer pessoa pode ver
================================ */
router.get("/", eventController.getEvents);

/* ================================
   MEUS EVENTOS
   Usuário logado
================================ */
router.get(
  "/meus-eventos",
  authMiddleware,
  eventController.getMeusEventos
);

/* ================================
   CONFIRMAR PRESENÇA
   Usuário logado
================================ */
router.post(
  "/:id/confirmar",
  authMiddleware,
  eventController.confirmarPresenca
);

/* ================================
   CANCELAR PRESENÇA
   Usuário logado
================================ */
router.delete(
  "/:id/confirmar",
  authMiddleware,
  eventController.cancelarPresenca
);

/* ================================
   CRIAR EVENTO
   Apenas admin
================================ */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  eventController.createEvent
);

/* ================================
   EDITAR EVENTO
   Apenas admin
================================ */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  eventController.updateEvent
);

/* ================================
   EXCLUIR EVENTO
   Apenas admin
================================ */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  eventController.deleteEvent
);

module.exports = router;