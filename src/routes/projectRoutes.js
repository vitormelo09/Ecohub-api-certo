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
 *         link_github:
 *           type: string
 *         tecnologias_usadas:
 *           type: string
 *         imagem:
 *           type: string
 */

// Listar todos os projetos
router.get("/", projectController.getProjects);

// Listar projetos do usuário logado
router.get("/meus", authMiddleware, projectController.getMyProjects);

// Criar projeto
router.post(
  "/",
  authMiddleware,
  upload.single("imagem"),
  projectController.createProject
);

// Curtir ou remover curtida do projeto
router.post("/:id/like", authMiddleware, projectController.toggleProjectLike);

// Deletar projeto
router.delete("/:id", authMiddleware, projectController.deleteProject);

module.exports = router;