const permitirTipos = (...tiposPermitidos) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado"
        });
      }
  
      const tipoUsuario = req.user.tipo;
  
      if (tipoUsuario === "admin" || tiposPermitidos.includes(tipoUsuario)) {
        return next();
      }
  
      return res.status(403).json({
        message: "Acesso negado. Você não tem permissão para fazer isso."
      });
    };
  };
  
  module.exports = permitirTipos;