const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

/**
 * @swagger
 * /api/news:
 * get:
 * summary: Lista todas as notícias
 * tags: [News]
 */
router.get("/", newsController.getNews);

/**
 * @swagger
 * /api/news:
 * post:
 * summary: Criar nova notícia (APENAS ADMIN)
 * tags: [News]
 * security:
 * - bearerAuth: []
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  newsController.createNews
);

/**
 * @swagger
 * /api/news/{id}:
 * delete:
 * summary: Deletar notícia (APENAS ADMIN)
 * tags: [News]
 * security:
 * - bearerAuth: []
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  newsController.deleteNews
);

// ESSA LINHA ABAIXO É A MAIS IMPORTANTE PARA O SERVER.JS NÃO QUEBRAR
module.exports = router;