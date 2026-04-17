const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", userController.getUsers);
router.get("/search", authMiddleware, userController.searchUsers);
router.get("/:id/profile", authMiddleware, userController.getUserProfile);

router.post("/register", userController.createUser);
router.post("/login", userController.login);

router.post("/:id/follow", authMiddleware, userController.followUser);
router.delete("/:id/follow", authMiddleware, userController.unfollowUser);

module.exports = router;