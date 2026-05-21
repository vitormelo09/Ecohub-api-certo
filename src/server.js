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

// USERS
const userRoutes = require("./routes/useRoutes");

// PROJETOS
const projectRoutes = require("./routes/projectRoutes");

// POSTS
const postRoutes = require("./routes/postRoutes");

// EVENTOS
const eventRoutes = require("./routes/eventRoutes");

// NOTÍCIAS
const newsRoutes = require("./routes/newsRoutes");

// COMENTÁRIOS
const commentRoutes = require("./routes/commentRoutes");

// LIKES
const likeRoutes = require("./routes/likeRoutes");

// NOTIFICAÇÕES
const notificationRoutes = require("./routes/notificationRoutes");

// HOME
const homeRoutes = require("./routes/homeRoutes");

// ADMIN
const adminRoutes = require("./routes/adminRoutes");

// REPORTS / DENÚNCIAS
const reportRoutes = require("./routes/reportRoutes");

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

// USERS
app.use("/api/users", userRoutes);

// PROJETOS
app.use("/api/projects", projectRoutes);

// POSTS
app.use("/api/posts", postRoutes);

// EVENTOS
app.use("/api/events", eventRoutes);

// NEWS
app.use("/api/news", newsRoutes);

// COMMENTS
app.use("/api/comments", commentRoutes);

// LIKES
app.use("/api/likes", likeRoutes);

// NOTIFICATIONS
app.use("/api/notifications", notificationRoutes);

// HOME
app.use("/api/home", homeRoutes);

// ADMIN
app.use("/api/admin", adminRoutes);

// REPORTS / DENÚNCIAS
app.use("/api/reports", reportRoutes);

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