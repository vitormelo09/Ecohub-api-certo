const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const adminPageMiddleware = require("../middlewares/adminPageMiddleware");

const adminProjetos = adminPageMiddleware("admin_projetos");

/* ==========================================
   LISTAR TODOS OS PROJETOS APROVADOS
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
   LISTAR PROJETOS PENDENTES
   admin geral ou admin_projetos
========================================== */
router.get(
  "/pendentes",
  authMiddleware,
  adminProjetos,
  projectController.getProjetosPendentes
);

/* ==========================================
   CRIAR PROJETO
   agora entra como pendente
========================================== */
router.post(
  "/",
  authMiddleware,
  upload.single("imagem"),
  projectController.createProject
);

/* ==========================================
   APROVAR PROJETO
========================================== */
router.put(
  "/:id/aprovar",
  authMiddleware,
  adminProjetos,
  projectController.aprovarProjeto
);

/* ==========================================
   REJEITAR PROJETO
========================================== */
router.put(
  "/:id/rejeitar",
  authMiddleware,
  adminProjetos,
  projectController.rejeitarProjeto
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
========================================== */
router.put(
  "/:id/destaque",
  authMiddleware,
  projectController.toggleProjectDestaque
);

/* ==========================================
   DELETAR PROJETO
========================================== */
router.delete(
  "/:id",
  authMiddleware,
  projectController.deleteProject
);

module.exports = router;