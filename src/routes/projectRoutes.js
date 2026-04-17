const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         titulo:
 *           type: string
 *         descricao:
 *           type: string
 *         link_projeto:
 *           type: string
 *         imagem:
 *           type: string
 *       example:
 *         titulo: Plataforma Sustentável
 *         descricao: Projeto de impacto ambiental
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Lista todos os projetos
 *     tags: [Projects]
 */
router.get("/", projectController.getProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Criar um novo projeto
 *     tags: [Projects]
 */
router.post(
  "/",
  authMiddleware,
  upload.single("imagem"),
  projectController.createProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Deletar projeto
 *     tags: [Projects]
 */
router.delete("/:id", authMiddleware, projectController.deleteProject);

module.exports = router;