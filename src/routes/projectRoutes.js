const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const adminPageMiddleware = require("../middlewares/adminPageMiddleware");

const adminProjetos = adminPageMiddleware("admin_projetos");

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
 *         destaque:
 *           type: integer
 */

/* ==========================================
   LISTAR TODOS OS PROJETOS
   filtros:
   ?ordem=recentes
   ?ordem=antigos
   ?ordem=curtidos
========================================== */
router.get("/", projectController.getProjects);

/* ==========================================
   LISTAR PROJETOS DO USUÁRIO LOGADO
========================================== */
router.get(
  "/meus",
  authMiddleware,
  projectController.getMyProjects
);

/* ==========================================
   CRIAR PROJETO
   imagem obrigatória
========================================== */
router.post(
  "/",
  authMiddleware,
  adminProjetos,
  upload.single("imagem"),
  projectController.createProject
);

/* ==========================================
   CURTIR / REMOVER CURTIDA
========================================== */
router.post(
  "/:id/like",
  authMiddleware,
  projectController.toggleProjectLike
);

/* ==========================================
   DESTACAR / REMOVER DESTAQUE
   estrela do projeto
========================================== */
router.put(
  "/:id/destaque",
  authMiddleware,
  adminProjetos,
  projectController.toggleProjectDestaque
);

/* ==========================================
   DELETAR PROJETO
========================================== */
router.delete(
  "/:id",
  authMiddleware,
  adminProjetos,
  projectController.deleteProject
);

module.exports = router;