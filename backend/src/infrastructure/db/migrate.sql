-- Migration: create_users_table
-- Executar no banco MySQL antes de subir a aplicação

CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)         NOT NULL,
  email       VARCHAR(191)         NOT NULL UNIQUE COMMENT 'max 191 para utf8mb4 + index',
  password    VARCHAR(255)         NOT NULL COMMENT 'bcrypt hash',
  role        ENUM('admin','user') NOT NULL DEFAULT 'user',
  avatar_url  VARCHAR(500)         NULL,
  active      TINYINT(1)           NOT NULL DEFAULT 1,
  created_at  DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login  DATETIME             NULL,
  INDEX idx_email  (email),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuário admin inicial (senha: Admin@1234 — TROCAR em produção)
INSERT IGNORE INTO users (name, email, password, role)
VALUES (
  'Administrador CCM',
  'admin@ccm.com.br',
  '$2b$12$LHaR8.YFXK9y8NZFUQ5XOOk7RmJQYP1gL6MBhZ3KqVfFEXQmDT5i',
  'admin'
);
