module.exports = (req, res, next) => {
  // Primeiro verifica se o usuário passou pelo authMiddleware
  if (!req.user) {
    return res.status(401).json({ 
      message: "Usuário não autenticado" 
    });
  }

  // Verifica se o TIPO do usuário no token é "admin"
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ 
      message: "Acesso permitido apenas para administradores" 
    });
  }

  // Se for admin, deixa passar
  next();
};