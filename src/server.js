const express = require("express");
const cors = require("cors");
const path = require("path");

const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swagger");

const db = require("./config/db");

const app = express();

const PORT = 3000;

/* ================================
   MIDDLEWARES
================================ */

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

/* ================================
   LIBERAR UPLOADS
================================ */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

/* ================================
   IMPORTAÇÃO DAS ROTAS
================================ */

// IMPORTANTE:
// Seu arquivo chama useRoutes.js
// então precisa importar assim:

const userRoutes = require("./routes/useRoutes");

const projectRoutes = require("./routes/projectRoutes");
const postRoutes = require("./routes/postRoutes");
const eventRoutes = require("./routes/eventRoutes");
const newsRoutes = require("./routes/newsRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const homeRoutes = require("./routes/homeRoutes");
const adminRoutes = require("./routes/adminRoutes");

/* ================================
   SWAGGER
================================ */

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs)
);

/* ================================
   ROTA PRINCIPAL
================================ */

app.get("/", (req, res) => {
  res.send("API EcoHub funcionando");
});

/* ================================
   ROTAS DA API
================================ */

app.use("/api/users", userRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/news", newsRoutes);

app.use("/api/comments", commentRoutes);

app.use("/api/likes", likeRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/home", homeRoutes);

app.use("/api/admin", adminRoutes);

/* ================================
   TESTE DE BANCO
================================ */

app.get("/teste-banco", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      return res.status(500).json({
        erro: "Banco não conectou",
        detalhes: err.message
      });
    }

    res.json({
      status: "Banco conectado com sucesso"
    });
  });
});

/* ================================
   INICIAR SERVIDOR
================================ */

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);

  console.log(
    `Swagger disponível em http://localhost:${PORT}/api-docs`
  );
});