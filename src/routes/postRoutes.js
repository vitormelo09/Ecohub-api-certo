const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         conteudo:
 *           type: string
 *         imagem:
 *           type: string
 *         user_id:
 *           type: integer
 *       example:
 *         conteudo: Meu primeiro post
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Lista todos os posts
 *     tags: [Posts]
 */
router.get("/", postController.getPosts);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Criar um novo post
 *     tags: [Posts]
 */
router.post(
  "/",
  authMiddleware,
  upload.single("imagem"),
  postController.createPost
);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Deletar post
 *     tags: [Posts]
 */
router.delete("/:id", authMiddleware, postController.deletePost);

module.exports = router;