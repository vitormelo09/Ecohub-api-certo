const express = require("express");
const router = express.Router();

const newsController = require("../controllers/newsController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

/* ================================
   LISTAR NOTÍCIAS
   Qualquer pessoa pode ver
================================ */
router.get("/", newsController.getNews);

/* ================================
   CURTIR NOTÍCIA
   Usuário logado
================================ */
router.post(
  "/:id/like",
  authMiddleware,
  newsController.likeNews
);

/* ================================
   REMOVER CURTIDA DA NOTÍCIA
   Usuário logado
================================ */
router.delete(
  "/:id/like",
  authMiddleware,
  newsController.unlikeNews
);

/* ================================
   CRIAR NOTÍCIA
   Apenas admin
================================ */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  newsController.createNews
);

/* ================================
   EXCLUIR NOTÍCIA
   Apenas admin
================================ */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  newsController.deleteNews
);

module.exports = router;