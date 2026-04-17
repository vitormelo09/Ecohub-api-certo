const express = require("express");
const cors = require('cors');
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swagger");
const db = require("./config/db");

const app = express();
const PORT = 3000;

// --- MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 

// --- IMPORTAÇÃO DE ROTAS ---
const userRoutes = require("./routes/useRoutes");
const projectRoutes = require("./routes/projectRoutes");
const postRoutes = require("./routes/postRoutes");
const eventRoutes = require("./routes/eventRoutes");
const newsRoutes = require("./routes/newsRoutes");
// Novas rotas que acabamos de criar:
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// --- SWAGGER ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- ROTAS DA API ---
app.get("/", (req, res) => {
  res.send("API EcoHub funcionando 🚀");
});

// Registro das rotas no Express
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/news", newsRoutes);
// Registro das novas rotas:
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/notifications", notificationRoutes);

// --- TESTE DE CONEXÃO COM O BANCO ---
app.get("/teste-banco", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      return res.status(500).json({ erro: "Banco não conectou", detalhes: err.message });
    }
    res.json({ status: "Banco conectado com sucesso" });
  });
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📖 Documentação Swagger: http://localhost:${PORT}/api-docs`);
});