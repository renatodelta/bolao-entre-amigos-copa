-- SQL Schema for Bolão Copa 2026

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

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Initial Matches
INSERT OR IGNORE INTO matches (id, home_team, home_abbrev, home_flag, away_team, away_abbrev, away_flag, status, time, start_time, home_score, away_score, email_sent) VALUES
('m1', 'Brasil', 'BRA', '🇧🇷', 'EUA', 'USA', '🇺🇸', 'live', '15 JUN • 21:00', datetime('now', '-1 hour'), 1, 0, 1),
('m2', 'Argentina', 'ARG', '🇦🇷', 'França', 'FRA', '🇫🇷', 'upcoming', '16 JUN • 16:00', datetime('now', '+1 hour'), null, null, 0),
('m3', 'Alemanha', 'GER', '🇩🇪', 'Espanha', 'ESP', '🇪🇸', 'upcoming', '17 JUN • 19:00', datetime('now', '+24 hours'), null, null, 0),
('m4', 'Itália', 'ITA', '🇮🇹', 'Inglaterra', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'completed', '14 JUN • Finalizado', datetime('now', '-48 hours'), 2, 1, 1);
