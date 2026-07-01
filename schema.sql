-- SQL Schema for Bolão Copa 2026 (Admin Approval System)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 0,
  global_rank INTEGER DEFAULT 9999,
  level_title TEXT DEFAULT 'Nível 1 — Estreante',
  status TEXT DEFAULT 'pending', -- pending, approved
  is_admin INTEGER DEFAULT 0, -- 0 = regular, 1 = admin
  notifications_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  home_team TEXT NOT NULL,
  home_abbrev TEXT NOT NULL,
  home_flag TEXT NOT NULL,
  away_team TEXT NOT NULL,
  away_abbrev TEXT NOT NULL,
  away_flag TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming', -- live, upcoming, completed
  time TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  email_sent INTEGER DEFAULT 0
);

-- Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
  user_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, match_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Seed Initial Matches
INSERT OR IGNORE INTO matches (id, home_team, home_abbrev, home_flag, away_team, away_abbrev, away_flag, status, time, start_time, home_score, away_score, email_sent) VALUES
('m1', 'Brasil', 'BRA', '🇧🇷', 'EUA', 'USA', '🇺🇸', 'completed', '15 JUN • Finalizado', '2026-06-15 21:00:00', 2, 1, 1),
('m2', 'Argentina', 'ARG', '🇦🇷', 'França', 'FRA', '🇫🇷', 'completed', '16 JUN • Finalizado', '2026-06-16 16:00:00', 1, 1, 1),
('m3', 'Alemanha', 'GER', '🇩🇪', 'Espanha', 'ESP', '🇪🇸', 'completed', '17 JUN • Finalizado', '2026-06-17 19:00:00', 0, 2, 1),
('m4', 'Itália', 'ITA', '🇮🇹', 'Inglaterra', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'completed', '14 JUN • Finalizado', '2026-06-14 18:00:00', 2, 1, 1),
('m5', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'completed', '28 JUN • Finalizado', '2026-06-28 16:00:00', 1, 0, 1),
('m6', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'completed', '29 JUN • Finalizado', '2026-06-29 14:00:00', 0, 0, 1),
('m7', 'Alemanha', 'GER', '🇩🇪', 'A definir', 'ADF', '🏳️', 'completed', '29 JUN • Finalizado', '2026-06-29 17:30:00', 3, 1, 1),
('m8', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'completed', '29 JUN • Finalizado', '2026-06-29 22:00:00', 1, 2, 1),
('m9', 'Costa do Marfim', 'CIV', '🇨🇮', 'Noruega', 'NOR', '🇳🇴', 'upcoming', '30 JUN • 18:00', '2026-06-30 18:00:00', null, null, 0),
('m10', 'França', 'FRA', '🇫🇷', 'Suécia', 'SWE', '🇸🇪', 'upcoming', '30 JUN • 22:00', '2026-06-30 22:00:00', null, null, 0),
('m11', 'Inglaterra', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'RD Congo', 'COD', '🇨🇩', 'upcoming', '01 JUL • 13:00', '2026-07-01 13:00:00', null, null, 0),
('m12', 'Bélgica', 'BEL', '🇧🇪', 'Senegal', 'SEN', '🇸🇳', 'upcoming', '01 JUL • 17:00', '2026-07-01 17:00:00', null, null, 0),
('m13', 'Estados Unidos', 'USA', '🇺🇸', 'Bósnia e Herzegovina', 'BIH', '🇧🇦', 'upcoming', '01 JUL • 21:00', '2026-07-01 21:00:00', null, null, 0),
('m14', 'Espanha', 'ESP', '🇪🇸', 'Áustria', 'AUT', '🇦🇹', 'upcoming', '02 JUL • 16:00', '2026-07-02 16:00:00', null, null, 0),
('m15', 'Portugal', 'POR', '🇵🇹', 'Croácia', 'CRO', '🇭🇷', 'upcoming', '02 JUL • 20:00', '2026-07-02 20:00:00', null, null, 0),
('m16', 'Suíça', 'SUI', '🇨🇭', 'Argélia', 'ALG', '🇩🇿', 'upcoming', '03 JUL • 00:00', '2026-07-03 00:00:00', null, null, 0),
('m17', 'Austrália', 'AUS', '🇦🇺', 'Egito', 'EGY', '🇪🇬', 'upcoming', '03 JUL • 15:00', '2026-07-03 15:00:00', null, null, 0),
('m18', 'Argentina', 'ARG', '🇦🇷', 'Cabo Verde', 'CPV', '🇨🇻', 'upcoming', '03 JUL • 19:00', '2026-07-03 19:00:00', null, null, 0),
('m19', 'Colômbia', 'COL', '🇨🇴', 'Gana', 'GHA', '🇬🇭', 'upcoming', '03 JUL • 22:30', '2026-07-03 22:30:00', null, null, 0),
('m20', 'Canadá', 'CAN', '🇨🇦', 'Marrocos', 'MAR', '🇲🇦', 'upcoming', '04 JUL • 14:00', '2026-07-04 14:00:00', null, null, 0),
('m21', 'Paraguai', 'PAR', '🇵🇾', 'França', 'FRA', '🇫🇷', 'upcoming', '04 JUL • 18:00', '2026-07-04 18:00:00', null, null, 0),
('m22', 'Brasil', 'BRA', '🇧🇷', 'Noruega', 'NOR', '🇳🇴', 'upcoming', '05 JUL • 17:00', '2026-07-05 17:00:00', null, null, 0),
('m23', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '05 JUL • 21:00', '2026-07-05 21:00:00', null, null, 0),
('m24', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '06 JUL • 16:00', '2026-07-06 16:00:00', null, null, 0),
('m25', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '06 JUL • 21:00', '2026-07-06 21:00:00', null, null, 0),
('m26', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '07 JUL • 13:00', '2026-07-07 13:00:00', null, null, 0),
('m27', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '07 JUL • 17:00', '2026-07-07 17:00:00', null, null, 0),
('m28', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '09 JUL • 17:00', '2026-07-09 17:00:00', null, null, 0),
('m29', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '10 JUL • 16:00', '2026-07-10 16:00:00', null, null, 0),
('m30', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '11 JUL • 18:00', '2026-07-11 18:00:00', null, null, 0),
('m31', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '11 JUL • 22:00', '2026-07-11 22:00:00', null, null, 0),
('m32', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '14 JUL • 16:00', '2026-07-14 16:00:00', null, null, 0),
('m33', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '15 JUL • 16:00', '2026-07-15 16:00:00', null, null, 0),
('m34', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '18 JUL • 18:00', '2026-07-18 18:00:00', null, null, 0),
('m35', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '19 JUL • 16:00', '2026-07-19 16:00:00', null, null, 0);

-- Seed Default Admin and User
INSERT OR IGNORE INTO users (id, name, email, password_hash, points, accuracy, global_rank, level_title, status, is_admin) VALUES
('admin_id', 'Administrador', 'admin@bolao.com', 'admin123', 0, 0, 999, 'Nível 100 — Organizador', 'approved', 1),
('pedro_mock_id', 'Pedro Alcântara', 'pedro@bolao.com', '123456', 1240, 68, 6, 'Nível 24 — Artilheiro', 'approved', 0),
('user_ana_id', 'Ana Cláudia', 'ana@bolao.com', '123456', 1520, 68, 2, 'Nível 30 — Veterana', 'approved', 0),
('user_rodrigo_id', 'Rodrigo', 'rodrigo@bolao.com', '123456', 1580, 72, 1, 'Nível 35 — Mestre', 'approved', 0),
('user_lucas_id', 'Lucas Lima', 'lucas@bolao.com', '123456', 0, 0, 999, 'Nível 1 — Estreante', 'pending', 0),
('user_mariana_id', 'Mariana Costa', 'mariana@bolao.com', '123456', 1390, 64, 3, 'Nível 27 — Ponta-de-Lança', 'approved', 0),
('user_carlos_id', 'Carlos Silva', 'carlos@bolao.com', '123456', 1100, 60, 7, 'Nível 20 — Camisa 10', 'approved', 0),
('user_beatriz_id', 'Beatriz Souza', 'beatriz@bolao.com', '123456', 950, 56, 8, 'Nível 15 — Volante', 'approved', 0),
('user_andre_id', 'André Santos', 'andre@bolao.com', '123456', 840, 52, 9, 'Nível 12 — Zagueiro', 'approved', 0),
('user_fernanda_id', 'Fernanda Alves', 'fernanda@bolao.com', '123456', 0, 0, 999, 'Nível 1 — Estreante', 'pending', 0),
('user_bruno_id', 'Bruno Oliveira', 'bruno@bolao.com', '123456', 720, 48, 10, 'Nível 10 — Lateral', 'approved', 0),
('user_juliana_id', 'Juliana Rocha', 'juliana@bolao.com', '123456', 0, 0, 999, 'Nível 1 — Estreante', 'pending', 0),
('user_gabriel_id', 'Gabriel Cruz', 'gabriel@bolao.com', '123456', 610, 44, 11, 'Nível 8 — Goleiro', 'approved', 0),
('user_camila_id', 'Camila Ribeiro', 'camila@bolao.com', '123456', 530, 40, 12, 'Nível 5 — Estreante', 'approved', 0),
('user_thiago_id', 'Thiago Lima', 'thiago@bolao.com', '123456', 0, 0, 999, 'Nível 1 — Estreante', 'pending', 0);

