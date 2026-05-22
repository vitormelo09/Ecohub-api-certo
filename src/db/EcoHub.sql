-- ==========================================
-- BANCO DE DADOS ECOHUB
-- Script completo atualizado para Vue + API MySQL
-- Compatível com:
-- ✔ Upload de imagem
-- ✔ Curtidas
-- ✔ Comentários
-- ✔ Eventos
-- ✔ Notícias
-- ✔ Curtidas em notícias
-- ✔ Admin específico por página
-- ✔ Denúncias de posts e projetos
-- ==========================================

CREATE DATABASE IF NOT EXISTS ecohub
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ecohub;

-- ==========================================
-- APAGAR TABELAS ANTIGAS
-- ==========================================

DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS comment_likes;
DROP TABLE IF EXISTS event_comments;
DROP TABLE IF EXISTS project_comments;
DROP TABLE IF EXISTS event_participants;
DROP TABLE IF EXISTS event_likes;
DROP TABLE IF EXISTS project_likes;
DROP TABLE IF EXISTS news_likes;
DROP TABLE IF EXISTS seguidores;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS users;

-- ==========================================
-- 1. TABELA DE USUÁRIOS
-- ==========================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ra VARCHAR(50) DEFAULT NULL UNIQUE,
    foto_perfil VARCHAR(500) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    curso VARCHAR(150) DEFAULT NULL,
    semestre VARCHAR(50) DEFAULT NULL,

    tipo ENUM(
        'aluno',
        'professor',
        'admin',
        'admin_eventos',
        'admin_noticias',
        'admin_projetos',
        'admin_feed'
    ) DEFAULT 'aluno',

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. TABELA DE POSTS
-- ==========================================

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,
    user_id INT DEFAULT NULL,

    conteudo TEXT NOT NULL,

    imagem VARCHAR(500) DEFAULT NULL,
    imagem_url VARCHAR(500) DEFAULT NULL,

    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_posts_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ==========================================
-- 3. TABELA DE COMENTÁRIOS DOS POSTS
-- ==========================================

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    post_id INT NOT NULL,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    texto TEXT DEFAULT NULL,
    conteudo TEXT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comments_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 4. TABELA DE CURTIDAS DOS POSTS
-- ==========================================

CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    post_id INT NOT NULL,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unico_like_post_usuario (post_id, usuario_id),
    UNIQUE KEY unico_like_post_user (post_id, user_id),

    CONSTRAINT fk_likes_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_likes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_likes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 4.1 CURTIDAS DOS COMENTÁRIOS
-- ==========================================

CREATE TABLE comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    comentario_id INT NOT NULL,
    usuario_id INT NOT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_comment_like (comentario_id, usuario_id),

    CONSTRAINT fk_comment_likes_comment
        FOREIGN KEY (comentario_id)
        REFERENCES comments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_likes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 5. TABELA DE PROJETOS
-- ==========================================

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,

    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,

    link_github VARCHAR(500) DEFAULT NULL,

    tecnologias_usadas VARCHAR(500) DEFAULT NULL,
    tecnologias VARCHAR(500) DEFAULT NULL,

    -- imagem agora é obrigatória
    imagem VARCHAR(500) NOT NULL,
    imagem_url VARCHAR(500) NOT NULL,

    -- estrela/destaque do projeto
    destaque TINYINT(1) NOT NULL DEFAULT 0,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_projects_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);
-- ==========================================
-- 6. CURTIDAS DOS PROJETOS
-- ==========================================

CREATE TABLE project_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    project_id INT NOT NULL,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unico_like_projeto_usuario (project_id, usuario_id),
    UNIQUE KEY unico_like_projeto_user (project_id, user_id),

    CONSTRAINT fk_project_likes_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_likes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_likes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 7. COMENTÁRIOS DOS PROJETOS
-- ==========================================

CREATE TABLE project_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    project_id INT NOT NULL,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    texto TEXT DEFAULT NULL,
    conteudo TEXT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_comments_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_comments_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_comments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 8. TABELA DE EVENTOS
-- ==========================================

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,

    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,

    tipo VARCHAR(100) DEFAULT 'Evento',
    categoria VARCHAR(100) DEFAULT NULL,

    data_evento DATETIME NOT NULL,
    data DATE DEFAULT NULL,

    horario VARCHAR(100) DEFAULT NULL,
    hora VARCHAR(100) DEFAULT NULL,

    local VARCHAR(255) NOT NULL,

    imagem VARCHAR(500) NOT NULL,
    imagem_url VARCHAR(500) NOT NULL,

    vagas INT DEFAULT NULL,
    capacidade INT NOT NULL DEFAULT 30,
    confirmados INT NOT NULL DEFAULT 0,

    criador_id INT DEFAULT NULL,
    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_criador
        FOREIGN KEY (criador_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ==========================================
-- 9. PARTICIPANTES DOS EVENTOS
-- ==========================================

CREATE TABLE event_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    user_id INT NOT NULL,
    usuario_id INT DEFAULT NULL,

    status ENUM(
        'confirmado',
        'cancelado'
    ) DEFAULT 'confirmado',

    data_confirmacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_event_user (event_id, user_id),

    CONSTRAINT fk_event_participants_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_participants_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_participants_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 10. CURTIDAS DOS EVENTOS
-- ==========================================

CREATE TABLE event_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unico_like_evento_usuario (event_id, usuario_id),
    UNIQUE KEY unico_like_evento_user (event_id, user_id),

    CONSTRAINT fk_event_likes_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_likes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_likes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 11. COMENTÁRIOS DOS EVENTOS
-- ==========================================

CREATE TABLE event_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    texto TEXT DEFAULT NULL,
    conteudo TEXT DEFAULT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_comments_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_comments_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_comments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 12. TABELA DE NOTÍCIAS
-- ==========================================

CREATE TABLE news (
    id INT AUTO_INCREMENT PRIMARY KEY,

    titulo VARCHAR(255) NOT NULL,

    resumo VARCHAR(255) DEFAULT NULL,

    categoria VARCHAR(100) DEFAULT NULL,

    conteudo TEXT DEFAULT NULL,
    conteudo_completo TEXT DEFAULT NULL,

    data_noticia DATE DEFAULT NULL,
    data DATE DEFAULT NULL,

    imagem VARCHAR(500) DEFAULT NULL,
    imagem_url VARCHAR(500) DEFAULT NULL,

    link VARCHAR(500) DEFAULT NULL,
    fonte VARCHAR(255) DEFAULT NULL,
    link_fonte VARCHAR(500) DEFAULT NULL,
    fonte_url VARCHAR(500) DEFAULT NULL,

    criador_id INT DEFAULT NULL,
    autor_id INT DEFAULT NULL,
    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,

    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_news_criador
        FOREIGN KEY (criador_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_news_autor
        FOREIGN KEY (autor_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_news_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_news_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ==========================================
-- 13. CURTIDAS DAS NOTÍCIAS
-- ==========================================

CREATE TABLE news_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    news_id INT NOT NULL,
    user_id INT NOT NULL,

    data_curtida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_news_user (news_id, user_id),

    CONSTRAINT fk_news_likes_news
        FOREIGN KEY (news_id)
        REFERENCES news(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_news_likes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 14. TABELA DE SEGUIDORES
-- ==========================================

CREATE TABLE seguidores (
    id INT AUTO_INCREMENT PRIMARY KEY,

    seguidor_id INT NOT NULL,
    seguindo_id INT NOT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unico_seguir (seguidor_id, seguindo_id),

    CONSTRAINT fk_seguidor
        FOREIGN KEY (seguidor_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_seguindo
        FOREIGN KEY (seguindo_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ==========================================
-- 15. TABELA DE DENÚNCIAS
-- ==========================================

CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    tipo ENUM(
        'post',
        'projeto'
    ) NOT NULL,

    referencia_id INT NOT NULL,

    motivo VARCHAR(255) NOT NULL,
    descricao TEXT DEFAULT NULL,

    status ENUM(
        'pendente',
        'analisado',
        'removido'
    ) DEFAULT 'pendente',

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reports_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================
-- 16. NOTIFICAÇÕES
-- ==========================================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    remetente_id INT DEFAULT NULL,

    tipo ENUM(
        'curtida',
        'comentario',
        'novo_evento',
        'sistema',
        'curtida_projeto',
        'comentario_projeto',
        'curtida_evento',
        'comentario_evento',
        'participacao_evento',
        'novo_seguidor'
    ) NOT NULL,

    post_id INT DEFAULT NULL,
    project_id INT DEFAULT NULL,
    event_id INT DEFAULT NULL,

    mensagem VARCHAR(255) DEFAULT NULL,

    lida BOOLEAN DEFAULT FALSE,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_remetente
        FOREIGN KEY (remetente_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_notifications_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- ==========================================
-- TESTE FINAL
-- ==========================================

SELECT 'Banco ecohub criado com sucesso e atualizado!' AS mensagem;