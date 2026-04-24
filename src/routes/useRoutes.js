const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

/* ================================
   UPLOAD FOTO PERFIL
================================ */

const pastaUploads = path.join(__dirname, "../../uploads/perfis");

if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },

  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `perfil-${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;

    cb(null, nomeArquivo);
  }
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens JPG, PNG ou WEBP são permitidas."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

/* ================================
   ROTAS DE USUÁRIO
================================ */

// Listar usuários
router.get("/", userController.getUsers);

// Buscar usuários no feed
router.get("/search", authMiddleware, userController.searchUsers);

// Meu perfil
router.get("/me", authMiddleware, userController.getMe);

// Atualizar meu perfil
router.put(
  "/me",
  authMiddleware,
  upload.single("foto"),
  userController.updateMyProfile
);

// Perfil público de um usuário
router.get("/:id/profile", authMiddleware, userController.getUserProfile);

// Cadastro
router.post("/register", userController.createUser);

// Login
router.post("/login", userController.login);

// Seguir usuário
router.post("/:id/follow", authMiddleware, userController.followUser);

// Deixar de seguir usuário
router.delete("/:id/follow", authMiddleware, userController.unfollowUser);

module.exports = router;