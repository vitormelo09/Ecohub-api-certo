const express = require("express");
const router = express.Router();
const likeController = require("../controllers/likeController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/toggle", authMiddleware, likeController.toggleLike);

module.exports = router;