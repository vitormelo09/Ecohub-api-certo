const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const adminPageMiddleware = require("../middlewares/adminPageMiddleware");

const adminFeed = adminPageMiddleware("admin_feed");

/* ================================
   ROTAS DE POSTS
================================ */

// Listar todos os posts
router.get("/", postController.getPosts);

// Listar posts do usuário logado
router.get(
  "/meus",
  authMiddleware,
  postController.getMyPosts
);

// Criar novo post com texto e/ou imagem
router.post(
  "/",
  authMiddleware,
  adminFeed,
  upload.single("imagem"),
  postController.createPost
);

// Editar post
router.put(
  "/:id",
  authMiddleware,
  adminFeed,
  postController.updatePost
);

// Deletar post
router.delete(
  "/:id",
  authMiddleware,
  adminFeed,
  postController.deletePost
);

module.exports = router;