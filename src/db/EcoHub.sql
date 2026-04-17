-- 1. Cria a base de dados (se não existir) e entra nela
CREATE DATABASE IF NOT EXISTS EcoHub;
USE EcoHub;

-- 2. Tabela de Utilizadores (Users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT 'perfil.jpg',
    bio TEXT,
    curso VARCHAR(100),
    tipo ENUM('aluno', 'professor', 'admin') DEFAULT 'aluno',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Posts do Feed
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    conteudo TEXT NOT NULL,
    imagem_url VARCHAR(255) DEFAULT NULL,
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Tabela de Comentários
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Tabela de Curtidas (Likes)
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    usuario_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, usuario_id) -- Impede que a mesma pessoa dê "like" duas vezes no mesmo post
);

-- 6. Tabela de Eventos
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    data_evento DATETIME NOT NULL,
    local VARCHAR(255),
    imagem_url VARCHAR(255),
    criador_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criador_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Tabela de Projetos (Ecossistema)
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    link_github VARCHAR(255),
    tecnologias_usadas VARCHAR(255),
    usuario_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Tabela de Notificações
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL, -- Quem recebe a notificação
    remetente_id INT NOT NULL, -- Quem fez a ação (ex: quem deu o like)
    tipo ENUM('curtida', 'comentario', 'novo_evento', 'sistema') NOT NULL,
    post_id INT DEFAULT NULL, -- Se for notificação de um post, guarda o ID aqui
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 9. Tabela de Notícias (Aba de notícias do ENIAC)
CREATE TABLE news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    resumo VARCHAR(255) NOT NULL,
    conteudo_completo TEXT NOT NULL,
    imagem_url VARCHAR(255),
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--10. Tabela de Seguidores (para o sistema de seguir usuários)
CREATE TABLE IF NOT EXISTS seguidores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seguidor_id INT NOT NULL,
  seguindo_id INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unico_seguir (seguidor_id, seguindo_id),
  CONSTRAINT fk_seguidor FOREIGN KEY (seguidor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_seguindo FOREIGN KEY (seguindo_id) REFERENCES users(id) ON DELETE CASCADE
);