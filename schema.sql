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
  avatar TEXT DEFAULT 'avatar.jpg',
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
('m1', 'África do Sul', 'RSA', '🇿🇦', 'Canadá', 'CAN', '🇨🇦', 'completed', '28 JUN • Finalizado', '2026-06-28 14:00:00', 0, 1, 1),
('m2', 'Países Baixos', 'NED', '🇳🇱', 'Marrocos', 'MAR', '🇲🇦', 'completed', '29 JUN • Finalizado', '2026-06-29 14:00:00', 1, 1, 1),
('m3', 'Alemanha', 'GER', '🇩🇪', 'Paraguai', 'PAR', '🇵🇾', 'completed', '29 JUN • Finalizado', '2026-06-29 17:30:00', 1, 1, 1),
('m4', 'França', 'FRA', '🇫🇷', 'Suécia', 'SWE', '🇸🇪', 'completed', '30 JUN • Finalizado', '2026-06-30 15:00:00', 3, 0, 1),
('m5', 'Bélgica', 'BEL', '🇧🇪', 'Senegal', 'SEN', '🇸🇳', 'upcoming', '01 JUL • 17:00', '2026-07-01 17:00:00', null, null, 0),
('m6', 'Estados Unidos', 'USA', '🇺🇸', 'Bósnia e Herzegovina', 'BIH', '🇧🇦', 'upcoming', '01 JUL • 21:00', '2026-07-01 21:00:00', null, null, 0),
('m7', 'Espanha', 'ESP', '🇪🇸', 'Áustria', 'AUT', '🇦🇹', 'upcoming', '02 JUL • 16:00', '2026-07-02 16:00:00', null, null, 0),
('m8', 'Portugal', 'POR', '🇵🇹', 'Croácia', 'CRO', '🇭🇷', 'upcoming', '02 JUL • 20:00', '2026-07-02 20:00:00', null, null, 0),
('m9', 'Brasil', 'BRA', '🇧🇷', 'Japão', 'JPN', '🇯🇵', 'completed', '29 JUN • Finalizado', '2026-06-29 20:00:00', 2, 1, 1),
('m10', 'Costa do Marfim', 'CIV', '🇨🇮', 'Noruega', 'NOR', '🇳🇴', 'completed', '30 JUN • Finalizado', '2026-06-30 18:00:00', 1, 2, 1),
('m11', 'México', 'MEX', '🇲🇽', 'Equador', 'ECU', '🇪🇨', 'upcoming', '30 JUN • 23:00', '2026-06-30 23:00:00', null, null, 0),
('m12', 'Inglaterra', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'RD Congo', 'COD', '🇨🇩', 'upcoming', '01 JUL • 13:00', '2026-07-01 13:00:00', null, null, 0),
('m13', 'Suíça', 'SUI', '🇨🇭', 'Argélia', 'ALG', '🇩🇿', 'upcoming', '03 JUL • 00:00', '2026-07-03 00:00:00', null, null, 0),
('m14', 'Colômbia', 'COL', '🇨🇴', 'Gana', 'GHA', '🇬🇭', 'upcoming', '03 JUL • 22:30', '2026-07-03 22:30:00', null, null, 0),
('m15', 'Austrália', 'AUS', '🇦🇺', 'Egito', 'EGY', '🇪🇬', 'upcoming', '03 JUL • 15:00', '2026-07-03 15:00:00', null, null, 0),
('m16', 'Argentina', 'ARG', '🇦🇷', 'Cabo Verde', 'CPV', '🇨🇻', 'upcoming', '03 JUL • 19:00', '2026-07-03 19:00:00', null, null, 0),
('m17', 'Canadá', 'CAN', '🇨🇦', 'Marrocos', 'MAR', '🇲🇦', 'upcoming', '04 JUL • 14:00', '2026-07-04 14:00:00', null, null, 0),
('m18', 'Paraguai', 'PAR', '🇵🇾', 'França', 'FRA', '🇫🇷', 'upcoming', '04 JUL • 18:00', '2026-07-04 18:00:00', null, null, 0),
('m19', 'Brasil', 'BRA', '🇧🇷', 'Noruega', 'NOR', '🇳🇴', 'upcoming', '05 JUL • 17:00', '2026-07-05 17:00:00', null, null, 0),
('m20', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '05 JUL • 21:00', '2026-07-05 21:00:00', null, null, 0),
('m21', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '06 JUL • 16:00', '2026-07-06 16:00:00', null, null, 0),
('m22', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '06 JUL • 21:00', '2026-07-06 21:00:00', null, null, 0),
('m23', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '07 JUL • 13:00', '2026-07-07 13:00:00', null, null, 0),
('m24', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '07 JUL • 17:00', '2026-07-07 17:00:00', null, null, 0),
('m25', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '09 JUL • 17:00', '2026-07-09 17:00:00', null, null, 0),
('m26', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '10 JUL • 16:00', '2026-07-10 16:00:00', null, null, 0),
('m27', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '11 JUL • 18:00', '2026-07-11 18:00:00', null, null, 0),
('m28', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '11 JUL • 22:00', '2026-07-11 22:00:00', null, null, 0),
('m29', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '14 JUL • 16:00', '2026-07-14 16:00:00', null, null, 0),
('m30', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '15 JUL • 16:00', '2026-07-15 16:00:00', null, null, 0),
('m31', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '18 JUL • 18:00', '2026-07-18 18:00:00', null, null, 0),
('m32', 'A definir', 'ADF', '🏳️', 'A definir', 'ADF', '🏳️', 'upcoming', '19 JUL • 16:00', '2026-07-19 16:00:00', null, null, 0);

-- Seed Default Admin and User
INSERT OR IGNORE INTO users (id, name, email, password_hash, points, accuracy, global_rank, level_title, status, is_admin, avatar) VALUES
('admin_id', 'Administrador', 'admin@bolao.com', 'admin123', 0, 0, 4, 'Nível 100 — Organizador', 'approved', 1, 'avatar.jpg'),
('pedro_mock_id', 'Pedro Alcântara', 'pedro@bolao.com', '123456', 1240, 68, 3, 'Nível 24 — Artilheiro', 'approved', 0, 'avatar.jpg'),
('user_ana_id', 'Ana Cláudia', 'ana@bolao.com', '123456', 1520, 68, 2, 'Nível 30 — Veterana', 'approved', 0, 'avatar2.jpg'),
('user_rodrigo_id', 'Rodrigo', 'rodrigo@bolao.com', '123456', 1580, 72, 1, 'Nível 35 — Mestre', 'approved', 0, 'avatar1.jpg');

