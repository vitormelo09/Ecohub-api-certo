const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         titulo:
 *           type: string
 *         descricao:
 *           type: string
 *         data:
 *           type: string
 *       example:
 *         titulo: Feira de Ciências
 *         descricao: Evento anual de apresentação de projetos científicos.
 *         data: 2026-04-20
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Lista todos os eventos
 *     tags: [Events]
 */
router.get("/", eventController.getEvents);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Criar evento (APENAS ADMIN)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  eventController.createEvent
);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Deletar evento (APENAS ADMIN)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  eventController.deleteEvent
);

module.exports = router;