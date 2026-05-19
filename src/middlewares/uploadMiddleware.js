const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================================
   PASTA DE UPLOADS
================================ */

const pastaUploads = path.join(__dirname, "../../uploads/posts");

if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, {
    recursive: true
  });
}

/* ================================
   STORAGE
================================ */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },

  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname).toLowerCase();

    const nomeArquivo =
      "post-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extensao;

    cb(null, nomeArquivo);
  }
});

/* ================================
   FILTRO DE ARQUIVOS
================================ */

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
    cb(
      new Error("Apenas imagens JPG, PNG e WEBP são permitidas."),
      false
    );
  }
};

/* ================================
   MULTER
================================ */

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;