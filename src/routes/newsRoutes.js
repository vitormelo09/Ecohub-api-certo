const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

const newsController = require("../controllers/newsController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

/* ================================
   CONFIGURAÇÃO DO UPLOAD
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "noticia-" + Date.now() + ext);
  }
});

const upload = multer({
  storage
});

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
  upload.single("imagem"),
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