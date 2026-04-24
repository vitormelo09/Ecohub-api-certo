const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const swaggerDocs = require("./docs/swagger");
const db = require("./config/db");

const app = express();
const PORT = 3000;

/* ================================
   MIDDLEWARES
================================ */
app.use(cors());
app.use(express.json());

/* Permite abrir imagens salvas na pasta uploads */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ================================
   ROTAS
================================ */
const userRoutes = require("./routes/useRoutes");
const projectRoutes = require("./routes/projectRoutes");
const postRoutes = require("./routes/postRoutes");
const eventRoutes = require("./routes/eventRoutes");
const newsRoutes = require("./routes/newsRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

/* ================================
   SWAGGER
================================ */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/* ================================
   API
================================ */
app.get("/", (req, res) => {
  res.send("API EcoHub funcionando");
});

app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/notifications", notificationRoutes);

/* ================================
   TESTE BANCO
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
   START
================================ */
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Documentação Swagger: http://localhost:${PORT}/api-docs`);
});