const express = require("express");

const router = express.Router();

const commentController = require("../controllers/commentController");

const authMiddleware = require("../middlewares/authMiddleware");

/* Buscar comentários de um post */
router.get("/post/:postId", authMiddleware, commentController.getCommentsByPost);

/* Criar comentário */
router.post("/", authMiddleware, commentController.createComment);

/* Editar comentário */
router.put("/:id", authMiddleware, commentController.updateComment);

/* Deletar comentário */
router.delete("/:id", authMiddleware, commentController.deleteComment);

module.exports = router;