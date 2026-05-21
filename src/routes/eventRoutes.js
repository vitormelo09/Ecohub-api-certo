const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminPageMiddleware = require("../middlewares/adminPageMiddleware");

const adminEventos = adminPageMiddleware("admin_eventos");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `evento-${Date.now()}${ext}`;
    cb(null, nomeArquivo);
  }
});

const fileFilter = (req, file, cb) => {
  console.log("ARQUIVO RECEBIDO NO MULTER:", file);

  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos."));
  }
};

const upload = multer({
  storage,
  fileFilter
});

/* LISTAR EVENTOS */
router.get("/", eventController.getEvents);

/* MEUS EVENTOS */
router.get(
  "/meus-eventos",
  authMiddleware,
  eventController.getMeusEventos
);

/* CONFIRMAR PRESENÇA */
router.post(
  "/:id/confirmar",
  authMiddleware,
  eventController.confirmarPresenca
);

/* CANCELAR PRESENÇA */
router.delete(
  "/:id/confirmar",
  authMiddleware,
  eventController.cancelarPresenca
);

/* CRIAR EVENTO */
router.post(
  "/",
  (req, res, next) => {
    console.log("CHEGOU NA ROTA POST /api/events");
    next();
  },
  authMiddleware,
  (req, res, next) => {
    console.log("PASSOU NO AUTH");
    console.log("USER APOS AUTH:", req.user);
    next();
  },
  adminEventos,
  (req, res, next) => {
    console.log("PASSOU NO ADMIN DE EVENTOS");
    next();
  },
  upload.single("imagem"),
  (req, res, next) => {
    console.log("PASSOU NO UPLOAD");
    console.log("BODY APOS UPLOAD:", req.body);
    console.log("FILE APOS UPLOAD:", req.file);
    next();
  },
  eventController.createEvent
);

/* EDITAR EVENTO */
router.put(
  "/:id",
  authMiddleware,
  adminEventos,
  upload.single("imagem"),
  eventController.updateEvent
);

/* EXCLUIR EVENTO */
router.delete(
  "/:id",
  authMiddleware,
  adminEventos,
  eventController.deleteEvent
);

module.exports = router;