const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

function montarUrlFoto(req, fotoPerfil) {
  if (!fotoPerfil) return null;

  if (fotoPerfil.startsWith("http")) {
    return fotoPerfil;
  }

  return `${req.protocol}://${req.get("host")}${fotoPerfil}`;
}

/* ================================
   LISTAR USUÁRIOS
================================ */
exports.getUsers = (req, res) => {
  const sql = `
    SELECT 
      id,
      nome,
      email,
      tipo,
      bio,
      foto_perfil,
      data_criacao
    FROM users
    ORDER BY nome ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    const usuarios = results.map((user) => ({
      ...user,
      foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
    }));

    res.json(usuarios);
  });
};

/* ================================
   BUSCAR USUÁRIOS
================================ */
exports.searchUsers = (req, res) => {
  const usuarioLogadoId = req.user.id;
  const termo = (req.query.q || "").trim();

  if (!termo) {
    return res.json([]);
  }

  const sql = `
    SELECT 
      u.id,
      u.nome,
      u.email,
      u.tipo,
      u.bio,
      u.foto_perfil,
      EXISTS (
        SELECT 1
        FROM seguidores s
        WHERE s.seguidor_id = ?
        AND s.seguindo_id = u.id
      ) AS seguindo
    FROM users u
    WHERE u.id <> ?
    AND (
      u.nome LIKE ?
      OR u.email LIKE ?
    )
    ORDER BY u.nome ASC
    LIMIT 20
  `;

  const busca = `%${termo}%`;

  db.query(
    sql,
    [usuarioLogadoId, usuarioLogadoId, busca, busca],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          erro: err.message
        });
      }

      const usuarios = results.map((user) => ({
        ...user,
        foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
      }));

      res.json(usuarios);
    }
  );
};

/* ================================
   MEU PERFIL
================================ */
exports.getMe = (req, res) => {
  const usuarioId = req.user.id;

  const sql = `
    SELECT 
      u.id,
      u.nome,
      u.email,
      u.tipo,
      u.bio,
      u.foto_perfil,
      u.data_criacao,

      (
        SELECT COUNT(*) 
        FROM seguidores 
        WHERE seguindo_id = u.id
      ) AS seguidores,

      (
        SELECT COUNT(*) 
        FROM seguidores 
        WHERE seguidor_id = u.id
      ) AS seguindo,

      (
        SELECT COUNT(*) 
        FROM posts 
        WHERE usuario_id = u.id
      ) AS posts

    FROM users u
    WHERE u.id = ?
  `;

  db.query(sql, [usuarioId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado"
      });
    }

    const usuario = {
      ...results[0],
      foto_perfil_url: montarUrlFoto(req, results[0].foto_perfil)
    };

    res.json(usuario);
  });
};

/* ================================
   PERFIL PÚBLICO
================================ */
exports.getUserProfile = (req, res) => {
  const usuarioLogadoId = req.user.id;
  const perfilId = Number(req.params.id);

  const sql = `
    SELECT 
      u.id,
      u.nome,
      u.email,
      u.tipo,
      u.bio,
      u.foto_perfil,
      u.data_criacao,

      (
        SELECT COUNT(*) 
        FROM seguidores 
        WHERE seguindo_id = u.id
      ) AS seguidores,

      (
        SELECT COUNT(*) 
        FROM seguidores 
        WHERE seguidor_id = u.id
      ) AS seguindo,

      (
        SELECT COUNT(*) 
        FROM posts 
        WHERE usuario_id = u.id
      ) AS posts,

      EXISTS (
        SELECT 1
        FROM seguidores s
        WHERE s.seguidor_id = ?
        AND s.seguindo_id = u.id
      ) AS euSigo

    FROM users u
    WHERE u.id = ?
  `;

  db.query(sql, [usuarioLogadoId, perfilId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado"
      });
    }

    const perfil = {
      ...results[0],
      foto_perfil_url: montarUrlFoto(req, results[0].foto_perfil)
    };

    res.json(perfil);
  });
};

/* ================================
   ATUALIZAR MEU PERFIL
================================ */
exports.updateMyProfile = (req, res) => {
  const usuarioId = req.user.id;
  const { nome, bio } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      erro: "O nome é obrigatório."
    });
  }

  let fotoPerfil = null;

  if (req.file) {
    fotoPerfil = `/uploads/perfis/${req.file.filename}`;
  }

  let sql;
  let params;

  if (fotoPerfil) {
    sql = `
      UPDATE users
      SET nome = ?, bio = ?, foto_perfil = ?
      WHERE id = ?
    `;

    params = [
      nome.trim(),
      bio ? bio.trim() : "",
      fotoPerfil,
      usuarioId
    ];
  } else {
    sql = `
      UPDATE users
      SET nome = ?, bio = ?
      WHERE id = ?
    `;

    params = [
      nome.trim(),
      bio ? bio.trim() : "",
      usuarioId
    ];
  }

  db.query(sql, params, (err) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    const buscarSql = `
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.tipo,
        u.bio,
        u.foto_perfil,
        u.data_criacao,

        (
          SELECT COUNT(*) 
          FROM seguidores 
          WHERE seguindo_id = u.id
        ) AS seguidores,

        (
          SELECT COUNT(*) 
          FROM seguidores 
          WHERE seguidor_id = u.id
        ) AS seguindo,

        (
          SELECT COUNT(*) 
          FROM posts 
          WHERE usuario_id = u.id
        ) AS posts

      FROM users u
      WHERE u.id = ?
    `;

    db.query(buscarSql, [usuarioId], (errBusca, results) => {
      if (errBusca) {
        return res.status(500).json({
          erro: errBusca.message
        });
      }

      const usuario = {
        ...results[0],
        foto_perfil_url: montarUrlFoto(req, results[0].foto_perfil)
      };

      res.json({
        mensagem: "Perfil atualizado com sucesso!",
        usuario
      });
    });
  });
};

/* ================================
   CRIAR USUÁRIO
================================ */
exports.createUser = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, email e senha são obrigatórios"
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const sql = `
      INSERT INTO users 
      (nome, email, senha, bio, foto_perfil)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [nome, email, senhaHash, "", null], (err, result) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro no banco de dados",
          detalhes: err.message
        });
      }

      res.status(201).json({
        mensagem: "Usuário criado com sucesso",
        id: result.insertId
      });
    });
  } catch (error) {
    res.status(500).json({
      erro: error.message
    });
  }
};

/* ================================
   LOGIN
================================ */
exports.login = (req, res) => {
  const { email, senha } = req.body;

  const sql = `
    SELECT *
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        erro: "Usuário não encontrado"
      });
    }

    const user = results[0];

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({
        erro: "Senha incorreta"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tipo: user.tipo
      },
      SECRET,
      {
        expiresIn: "1d"
      }
    );

    const buscarSql = `
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.tipo,
        u.bio,
        u.foto_perfil,
        u.data_criacao,

        (
          SELECT COUNT(*) 
          FROM seguidores 
          WHERE seguindo_id = u.id
        ) AS seguidores,

        (
          SELECT COUNT(*) 
          FROM seguidores 
          WHERE seguidor_id = u.id
        ) AS seguindo,

        (
          SELECT COUNT(*) 
          FROM posts 
          WHERE usuario_id = u.id
        ) AS posts

      FROM users u
      WHERE u.id = ?
    `;

    db.query(buscarSql, [user.id], (errBusca, resultsBusca) => {
      if (errBusca) {
        return res.status(500).json({
          erro: errBusca.message
        });
      }

      const usuario = {
        ...resultsBusca[0],
        foto_perfil_url: montarUrlFoto(req, resultsBusca[0].foto_perfil)
      };

      res.json({
        mensagem: "Login realizado com sucesso",
        token,
        usuario
      });
    });
  });
};

/* ================================
   SEGUIR USUÁRIO
================================ */
exports.followUser = (req, res) => {
  const seguidorId = req.user.id;
  const seguindoId = Number(req.params.id);

  if (!seguindoId) {
    return res.status(400).json({
      erro: "ID do usuário é obrigatório."
    });
  }

  if (Number(seguidorId) === Number(seguindoId)) {
    return res.status(400).json({
      erro: "Você não pode seguir a si mesmo."
    });
  }

  const verificarUsuarioSql = `
    SELECT id 
    FROM users 
    WHERE id = ?
  `;

  db.query(verificarUsuarioSql, [seguindoId], (err, users) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    if (users.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado."
      });
    }

    const sql = `
      INSERT IGNORE INTO seguidores 
      (seguidor_id, seguindo_id)
      VALUES (?, ?)
    `;

    db.query(sql, [seguidorId, seguindoId], (err2) => {
      if (err2) {
        return res.status(500).json({
          erro: err2.message
        });
      }

      res.status(201).json({
        mensagem: "Usuário seguido com sucesso.",
        seguindo: 1
      });
    });
  });
};

/* ================================
   DEIXAR DE SEGUIR
================================ */
exports.unfollowUser = (req, res) => {
  const seguidorId = req.user.id;
  const seguindoId = Number(req.params.id);

  if (!seguindoId) {
    return res.status(400).json({
      erro: "ID do usuário é obrigatório."
    });
  }

  const sql = `
    DELETE FROM seguidores
    WHERE seguidor_id = ?
    AND seguindo_id = ?
  `;

  db.query(sql, [seguidorId, seguindoId], (err) => {
    if (err) {
      return res.status(500).json({
        erro: err.message
      });
    }

    res.json({
      mensagem: "Usuário deixado de seguir com sucesso.",
      seguindo: 0
    });
  });
};