const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

/* ================================
   ROTAS DE POSTS
================================ */

// Listar todos os posts
router.get("/", postController.getPosts);

// Listar posts do usuário logado
router.get("/meus", authMiddleware, postController.getMyPosts);

// Criar novo post com texto e/ou imagem
router.post(
  "/",
  authMiddleware,
  upload.single("imagem"),
  postController.createPost
);

// Editar post
router.put("/:id", authMiddleware, postController.updatePost);

// Deletar post
router.delete("/:id", authMiddleware, postController.deletePost);

module.exports = router;