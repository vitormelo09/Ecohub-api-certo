const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

const emailsAdmins = [
  "238482024@eniac.edu.br"
];

function montarUrlFoto(req, fotoPerfil) {
  if (!fotoPerfil) return null;

  if (fotoPerfil.startsWith("http")) {
    return fotoPerfil;
  }

  return `${req.protocol}://${req.get("host")}${fotoPerfil}`;
}

function montarCaminhoFoto(req) {
  if (!req.file) return null;

  const caminhoArquivo = req.file.path.replace(/\\/g, "/");
  const indexUploads = caminhoArquivo.indexOf("uploads/");

  if (indexUploads === -1) {
    return `/uploads/perfis/${req.file.filename}`;
  }

  return "/" + caminhoArquivo.substring(indexUploads);
}

/* ================================
   LISTAR USUÁRIOS
================================ */
exports.getUsers = (req, res) => {
  const sql = `
    SELECT 
      id, nome, email, tipo, bio, curso, semestre, foto_perfil, data_criacao
    FROM users
    ORDER BY nome ASC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });

    res.json(results.map(user => ({
      ...user,
      foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
    })));
  });
};

/* ================================
   BUSCAR USUÁRIOS
================================ */
exports.searchUsers = (req, res) => {
  const usuarioLogadoId = req.user.id;
  const termo = (req.query.q || "").trim();

  if (!termo) return res.json([]);

  const sql = `
    SELECT 
      u.id, u.nome, u.email, u.tipo, u.bio, u.curso, u.semestre, u.foto_perfil,
      EXISTS (
        SELECT 1 FROM seguidores s
        WHERE s.seguidor_id = ? AND s.seguindo_id = u.id
      ) AS seguindo
    FROM users u
    WHERE u.id <> ?
    AND (u.nome LIKE ? OR u.email LIKE ?)
    ORDER BY u.nome ASC
    LIMIT 20
  `;

  const busca = `%${termo}%`;

  db.query(sql, [usuarioLogadoId, usuarioLogadoId, busca, busca], (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });

    res.json(results.map(user => ({
      ...user,
      foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
    })));
  });
};

/* ================================
   SUGESTÕES DE USUÁRIOS
================================ */
exports.getUserSuggestions = (req, res) => {
  const usuarioLogadoId = req.user.id;

  const sql = `
    SELECT 
      u.id, 
      u.nome, 
      u.email, 
      u.tipo, 
      u.bio, 
      u.curso, 
      u.semestre, 
      u.foto_perfil,
      0 AS seguindo
    FROM users u
    WHERE u.id <> ?
    AND u.id NOT IN (
      SELECT s.seguindo_id
      FROM seguidores s
      WHERE s.seguidor_id = ?
    )
    ORDER BY RAND()
    LIMIT 3
  `;

  db.query(sql, [usuarioLogadoId, usuarioLogadoId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar sugestões",
        detalhes: err.message
      });
    }

    res.json(results.map(user => ({
      ...user,
      foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
    })));
  });
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
      u.curso,
      u.semestre,
      u.foto_perfil,
      u.data_criacao,
      u.post_fixado_id,

      (SELECT COUNT(*) FROM seguidores WHERE seguindo_id = u.id) AS seguidores,
      (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id) AS seguindo,
      (SELECT COUNT(*) FROM posts WHERE usuario_id = u.id) AS posts

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

    const user = results[0];

    // Se não tiver post fixado
    if (!user.post_fixado_id) {
      return res.json({
        ...user,
        post_fixado: null,
        foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
      });
    }

    // Buscar post fixado
    const postSql = `
      SELECT 
        p.id,
        p.usuario_id,
        p.conteudo,
        p.imagem_url,
        p.data_publicacao,

        u.nome,
        u.email,
        u.foto_perfil,

        COUNT(DISTINCT l.id) AS likes

      FROM posts p

      INNER JOIN users u 
        ON u.id = p.usuario_id

      LEFT JOIN likes l 
        ON l.post_id = p.id

      WHERE p.id = ?

      GROUP BY
        p.id,
        p.usuario_id,
        p.conteudo,
        p.imagem_url,
        p.data_publicacao,
        u.nome,
        u.email,
        u.foto_perfil
    `;

    db.query(postSql, [user.post_fixado_id], (errPost, postResults) => {

      if (errPost) {
        return res.status(500).json({
          erro: "Erro ao buscar post fixado",
          detalhes: errPost.message
        });
      }

      const postFixado = postResults[0] || null;

      res.json({
        ...user,

        post_fixado: postFixado
          ? {
              ...postFixado,
              foto_perfil_url: montarUrlFoto(
                req,
                postFixado.foto_perfil
              )
            }
          : null,

        foto_perfil_url: montarUrlFoto(
          req,
          user.foto_perfil
        )
      });
    });
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
      u.curso,
      u.semestre,
      u.foto_perfil,
      u.data_criacao,
      u.post_fixado_id,

      (SELECT COUNT(*) FROM seguidores WHERE seguindo_id = u.id) AS seguidores,
      (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id) AS seguindo,
      (SELECT COUNT(*) FROM posts WHERE usuario_id = u.id) AS posts,

      EXISTS (
        SELECT 1 FROM seguidores s
        WHERE s.seguidor_id = ? AND s.seguindo_id = u.id
      ) AS euSigo

    FROM users u
    WHERE u.id = ?
  `;

  db.query(sql, [usuarioLogadoId, perfilId], (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });

    if (results.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const user = results[0];

    if (!user.post_fixado_id) {
      return res.json({
        ...user,
        post_fixado: null,
        foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
      });
    }

    const postSql = `
      SELECT 
        p.id,
        p.usuario_id,
        p.conteudo,
        p.imagem_url,
        p.data_publicacao,
        u.nome,
        u.email,
        u.foto_perfil,
        COUNT(DISTINCT l.id) AS likes
      FROM posts p
      INNER JOIN users u ON u.id = p.usuario_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.id = ?
      GROUP BY
        p.id,
        p.usuario_id,
        p.conteudo,
        p.imagem_url,
        p.data_publicacao,
        u.nome,
        u.email,
        u.foto_perfil
    `;

    db.query(postSql, [user.post_fixado_id], (errPost, postResults) => {
      if (errPost) {
        return res.status(500).json({
          erro: "Erro ao buscar post fixado",
          detalhes: errPost.message
        });
      }

      const postFixado = postResults[0] || null;

      return res.json({
        ...user,
        post_fixado: postFixado,
        foto_perfil_url: montarUrlFoto(req, user.foto_perfil)
      });
    });
  });
};

/* ================================
   POSTS DO USUÁRIO
================================ */
exports.getUserPosts = (req, res) => {
  const usuarioId = Number(req.params.id);
  const usuarioLogadoId = req.user.id;

  const sql = `
    SELECT 
      p.id,
      p.usuario_id,
      p.conteudo,
      p.imagem_url,
      p.data_publicacao,

      u.nome,
      u.email,
      u.foto_perfil,

      COUNT(DISTINCT l.id) AS likes,
      COUNT(DISTINCT c.id) AS totalComentarios,

      EXISTS (
        SELECT 1
        FROM likes lk
        WHERE lk.post_id = p.id
        AND lk.usuario_id = ?
      ) AS curtidoPorMim

    FROM posts p
    INNER JOIN users u ON u.id = p.usuario_id
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN comments c ON c.post_id = p.id

    WHERE p.usuario_id = ?

    GROUP BY 
      p.id,
      p.usuario_id,
      p.conteudo,
      p.imagem_url,
      p.data_publicacao,
      u.nome,
      u.email,
      u.foto_perfil

    ORDER BY p.data_publicacao DESC
  `;

  db.query(sql, [usuarioLogadoId, usuarioId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar posts do usuário",
        detalhes: err.message
      });
    }

    res.json(results.map(post => ({
      ...post,
      foto_perfil_url: montarUrlFoto(req, post.foto_perfil)
    })));
  });
};
/* ================================
   PROJETOS DO USUÁRIO
================================ */
exports.getUserProjects = (req, res) => {
  const usuarioId = Number(req.params.id);

  const sql = `
    SELECT *
    FROM projects
    WHERE usuario_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [usuarioId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar projetos do usuário",
        detalhes: err.message
      });
    }

    res.json(results);
  });
};

/* ================================
   COMENTÁRIOS DO USUÁRIO
================================ */
exports.getUserComments = (req, res) => {
  const usuarioId = Number(req.params.id);

  const sql = `
    SELECT 
      c.id,
      c.post_id,
      c.usuario_id,
      c.texto,
      c.data_criacao,

      p.conteudo AS post_conteudo,

      u.nome,
      u.foto_perfil

    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    INNER JOIN users u ON u.id = c.usuario_id

    WHERE c.usuario_id = ?

    ORDER BY c.data_criacao DESC
  `;

  db.query(sql, [usuarioId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao buscar comentários do usuário",
        detalhes: err.message
      });
    }

    res.json(results.map(comentario => ({
      ...comentario,
      foto_perfil_url: montarUrlFoto(req, comentario.foto_perfil)
    })));
  });
};

/* ================================
   ATUALIZAR MEU PERFIL
================================ */
exports.updateMyProfile = (req, res) => {
  const usuarioId = req.user.id;
  const { nome, bio, curso, semestre } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      erro: "O nome é obrigatório."
    });
  }

  const fotoPerfil = montarCaminhoFoto(req);

  const sql = fotoPerfil
    ? `
      UPDATE users
      SET nome = ?, bio = ?, curso = ?, semestre = ?, foto_perfil = ?
      WHERE id = ?
    `
    : `
      UPDATE users
      SET nome = ?, bio = ?, curso = ?, semestre = ?
      WHERE id = ?
    `;

  const params = fotoPerfil
    ? [
        nome.trim(),
        bio ? bio.trim() : "",
        curso ? curso.trim() : "",
        semestre ? semestre.trim() : "",
        fotoPerfil,
        usuarioId
      ]
    : [
        nome.trim(),
        bio ? bio.trim() : "",
        curso ? curso.trim() : "",
        semestre ? semestre.trim() : "",
        usuarioId
      ];

  db.query(sql, params, (err) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao atualizar perfil",
        detalhes: err.message
      });
    }

    req.user.id = usuarioId;
    return exports.getMe(req, res);
  });
};

/* ================================
   CRIAR USUÁRIO
================================ */
exports.createUser = async (req, res) => {
  try {
    const { nome, email, senha, curso, semestre } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, email e senha são obrigatórios"
      });
    }

    const emailNormalizado = email.toLowerCase().trim().replace(/\s/g, "");
    const tipo = emailsAdmins.includes(emailNormalizado) ? "admin" : "aluno";
    const senhaHash = await bcrypt.hash(senha, 10);

    const sqlVerificar = `
      SELECT id FROM users WHERE email = ?
    `;

    db.query(sqlVerificar, [emailNormalizado], (errVerificar, results) => {
      if (errVerificar) {
        return res.status(500).json({
          erro: "Erro ao verificar email",
          detalhes: errVerificar.message
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          erro: "Este email já está cadastrado"
        });
      }

      const sql = `
        INSERT INTO users 
        (nome, email, senha, tipo, bio, curso, semestre, foto_perfil)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          nome,
          emailNormalizado,
          senhaHash,
          tipo,
          "",
          curso || "",
          semestre || "",
          null
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              erro: "Erro no banco de dados",
              detalhes: err.message
            });
          }

          res.status(201).json({
            mensagem: "Usuário criado com sucesso",
            id: result.insertId,
            usuario: {
              id: result.insertId,
              nome,
              email: emailNormalizado,
              tipo,
              bio: "",
              curso: curso || "",
              semestre: semestre || "",
              foto_perfil: null
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

/* ================================
   LOGIN
================================ */
exports.login = (req, res) => {
  const { email, senha } = req.body;
  const emailNormalizado = email.toLowerCase().trim().replace(/\s/g, "");

  const sql = `
    SELECT *
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [emailNormalizado], async (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });

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
        u.id, u.nome, u.email, u.tipo, u.bio, u.curso, u.semestre, u.foto_perfil, u.data_criacao,

        (SELECT COUNT(*) FROM seguidores WHERE seguindo_id = u.id) AS seguidores,
        (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id) AS seguindo,
        (SELECT COUNT(*) FROM posts WHERE usuario_id = u.id) AS posts

      FROM users u
      WHERE u.id = ?
    `;

    db.query(buscarSql, [user.id], (errBusca, resultsBusca) => {
      if (errBusca) return res.status(500).json({ erro: errBusca.message });

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
    SELECT id FROM users WHERE id = ?
  `;

  db.query(verificarUsuarioSql, [seguindoId], (err, users) => {
    if (err) return res.status(500).json({ erro: err.message });

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
      if (err2) return res.status(500).json({ erro: err2.message });

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
    if (err) return res.status(500).json({ erro: err.message });

    res.json({
      mensagem: "Usuário deixado de seguir com sucesso.",
      seguindo: 0
    });
  });
};

/* ================================
   ALTERAR TIPO DE USUÁRIO
   Apenas admin principal
================================ */
exports.updateUserTipo = (req, res) => {
  const adminLogado = req.user;

  // Segurança extra
  if (adminLogado.tipo !== "admin") {
    return res.status(403).json({
      erro: "Apenas o admin principal pode alterar permissões."
    });
  }

  const usuarioId = Number(req.params.id);
  const { tipo } = req.body;

  const tiposPermitidos = [
    "aluno",
    "professor",
    "admin",
    "admin_eventos",
    "admin_noticias",
    "admin_projetos",
    "admin_feed"
  ];

  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({
      erro: "Tipo de usuário inválido."
    });
  }

  const sql = `
    UPDATE users
    SET tipo = ?
    WHERE id = ?
  `;

  db.query(sql, [tipo, usuarioId], (err, result) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao atualizar tipo do usuário",
        detalhes: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado."
      });
    }

    res.json({
      mensagem: "Tipo de usuário atualizado com sucesso.",
      usuarioId,
      novoTipo: tipo
    });
  });
};

/* ================================
   FIXAR COMENTÁRIO NO PERFIL
================================ */
exports.fixarComentarioPerfil = (req, res) => {
  const usuarioId = req.user.id;
  const { comentarioId } = req.body;

  if (!comentarioId) {
    return res.status(400).json({
      erro: "ID do comentário é obrigatório."
    });
  }

  const verificarSql = `
    SELECT id, usuario_id
    FROM comments
    WHERE id = ?
  `;

  db.query(verificarSql, [comentarioId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao verificar comentário",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Comentário não encontrado."
      });
    }

    if (Number(results[0].usuario_id) !== Number(usuarioId)) {
      return res.status(403).json({
        erro: "Você só pode fixar comentários feitos por você."
      });
    }

    const sql = `
      UPDATE users
      SET comentario_fixado_id = ?
      WHERE id = ?
    `;

    db.query(sql, [comentarioId, usuarioId], (err2) => {
      if (err2) {
        return res.status(500).json({
          erro: "Erro ao fixar comentário",
          detalhes: err2.message
        });
      }

      res.json({
        mensagem: "Comentário fixado com sucesso!",
        comentario_fixado_id: comentarioId
      });
    });
  });
};

/* ================================
   REMOVER COMENTÁRIO FIXADO
================================ */
exports.removerComentarioFixado = (req, res) => {
  const usuarioId = req.user.id;

  const sql = `
    UPDATE users
    SET comentario_fixado_id = NULL
    WHERE id = ?
  `;

  db.query(sql, [usuarioId], (err) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao remover comentário fixado",
        detalhes: err.message
      });
    }

    res.json({
      mensagem: "Comentário fixado removido com sucesso!"
    });
  });
};

/* ================================
   FIXAR POST NO PERFIL
================================ */
exports.fixarPostPerfil = (req, res) => {
  const usuarioId = req.user.id;
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({
      erro: "ID do post é obrigatório."
    });
  }

  const verificarSql = `
    SELECT id, usuario_id
    FROM posts
    WHERE id = ?
  `;

  db.query(verificarSql, [postId], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao verificar post",
        detalhes: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Post não encontrado."
      });
    }

    if (Number(results[0].usuario_id) !== Number(usuarioId)) {
      return res.status(403).json({
        erro: "Você só pode fixar posts seus."
      });
    }

    const sql = `
      UPDATE users
      SET post_fixado_id = ?
      WHERE id = ?
    `;

    db.query(sql, [postId, usuarioId], (err2) => {
      if (err2) {
        return res.status(500).json({
          erro: "Erro ao fixar post",
          detalhes: err2.message
        });
      }

      res.json({
        mensagem: "Post fixado com sucesso!"
      });
    });
  });
};

/* ================================
   REMOVER POST FIXADO
================================ */
exports.removerPostFixado = (req, res) => {
  const usuarioId = req.user.id;

  const sql = `
    UPDATE users
    SET post_fixado_id = NULL
    WHERE id = ?
  `;

  db.query(sql, [usuarioId], (err) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro ao remover post fixado",
        detalhes: err.message
      });
    }

    res.json({
      mensagem: "Post removido do perfil!"
    });
  });
};