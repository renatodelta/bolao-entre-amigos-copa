import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt, sign } from 'hono/jwt';

// Initialize Hono App
const app = new Hono();

// Enable CORS
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

const JWT_SECRET = 'bolao-copa-2026-super-secret-key';

// JWT Middleware for Protected Routes
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token não fornecido ou inválido' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const payload = await c.get('jwtPayload') || {}; 
    c.set('userId', payload.sub || 'pedro_mock_id');
    await next();
  } catch (err) {
    return c.json({ error: 'Token inválido ou expirado' }, 401);
  }
};

// Bind JWT Validation on Protected Endpoints
app.use('/api/protected/*', jwt({ secret: JWT_SECRET, alg: 'HS256' }));
app.use('/api/protected/*', authMiddleware);

// Helper for generating IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- AUTH ENDPOINTS ---

// 1. REGISTER
app.post('/api/auth/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    if (!name || !email || !password) {
      return c.json({ error: 'Campos obrigatórios ausentes' }, 400);
    }

    const db = c.env?.DB;
    if (!db) {
      // Standalone sandbox mock registration
      return c.json({
        message: 'Mock register success (Standalone Mode)',
        token: 'mock-jwt-token-newuser',
        user: { id: 'mock_newuser', name, email, points: 0, accuracy: 0, status: 'pending', is_admin: 0 }
      });
    }

    const userId = generateId();
    // Insert user with status = 'pending' and is_admin = 0
    await db.prepare(
      "INSERT INTO users (id, name, email, password_hash, points, accuracy, global_rank, status, is_admin) VALUES (?, ?, ?, ?, 0, 0, 9999, 'pending', 0)"
    ).bind(userId, name, email, password).run();

    const token = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + (3600 * 24 * 7) }, JWT_SECRET);

    return c.json({
      token,
      user: { id: userId, name, email, points: 0, accuracy: 0, status: 'pending', is_admin: 0 }
    });
  } catch (err) {
    return c.json({ error: err.message || 'Erro ao registrar usuário' }, 500);
  }
});

// 2. LOGIN
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: 'Campos obrigatórios ausentes' }, 400);
    }

    const db = c.env?.DB;
    if (!db) {
      // Local fallback Mock logins
      if (email === 'admin@bolao.com' && password === 'admin123') {
        return c.json({
          token: 'mock-jwt-token-admin',
          user: { id: 'admin_id', name: 'Administrador', email, points: 0, accuracy: 0, status: 'approved', is_admin: 1 }
        });
      }
      if (email === 'pedro@bolao.com' && password === '123456') {
        return c.json({
          token: 'mock-jwt-token-pedro',
          user: { id: 'pedro_mock_id', name: 'Pedro Alcântara', email, points: 1240, accuracy: 68, status: 'approved', is_admin: 0 }
        });
      }
      return c.json({ error: 'Credenciais inválidas no modo Mock' }, 401);
    }

    const user = await db.prepare(
      'SELECT id, name, email, password_hash, points, accuracy, global_rank, level_title, status, is_admin, notifications_enabled FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user || user.password_hash !== password) {
      return c.json({ error: 'E-mail ou senha incorretos' }, 401);
    }

    const token = await sign({ sub: user.id, exp: Math.floor(Date.now() / 1000) + (3600 * 24 * 7) }, JWT_SECRET);

    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        accuracy: user.accuracy,
        global_rank: user.global_rank,
        level_title: user.level_title,
        status: user.status,
        is_admin: user.is_admin,
        notifications_enabled: user.notifications_enabled
      }
    });
  } catch (err) {
    return c.json({ error: err.message || 'Erro ao efetuar login' }, 500);
  }
});

// --- MATCHES ENDPOINT ---
app.get('/api/matches', async (c) => {
  const db = c.env?.DB;
  if (!db) {
    return c.json([
      { id: "m1", homeTeam: "Brasil", homeAbbrev: "BRA", homeFlag: "🇧🇷", awayTeam: "EUA", awayAbbrev: "USA", awayFlag: "🇺🇸", status: "completed", time: "15 JUN • Finalizado", homeScore: 2, awayScore: 1 },
      { id: "m2", homeTeam: "Argentina", homeAbbrev: "ARG", homeFlag: "🇦🇷", awayTeam: "França", awayAbbrev: "FRA", awayFlag: "🇫🇷", status: "completed", time: "16 JUN • Finalizado", homeScore: 1, awayScore: 1 },
      { id: "m3", homeTeam: "Alemanha", homeAbbrev: "GER", homeFlag: "🇩🇪", awayTeam: "Espanha", awayAbbrev: "ESP", awayFlag: "🇪🇸", status: "completed", time: "17 JUN • Finalizado", homeScore: 0, awayScore: 2 },
      { id: "m4", homeTeam: "Itália", homeAbbrev: "ITA", homeFlag: "🇮🇹", awayTeam: "Inglaterra", awayAbbrev: "ENG", awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", status: "completed", time: "14 JUN • Finalizado", homeScore: 2, awayScore: 1 }
    ]);
  }
  try {
    const { results } = await db.prepare('SELECT * FROM matches ORDER BY start_time ASC').all();
    return c.json(results);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// --- PROTECTED USER ENDPOINTS ---

// 3. PROFILE DATA
app.get('/api/protected/me', async (c) => {
  const userId = c.get('userId');
  const db = c.env?.DB;

  if (!db) {
    return c.json({
      id: userId,
      name: userId === 'admin_id' ? 'Administrador' : 'Pedro Alcântara',
      email: userId === 'admin_id' ? 'admin@bolao.com' : 'pedro@bolao.com',
      points: userId === 'admin_id' ? 0 : 1240,
      accuracy: userId === 'admin_id' ? 0 : 68,
      globalRank: userId === 'admin_id' ? 999 : 42,
      levelTitle: userId === 'admin_id' ? "Nível 100 — Organizador" : "Nível 24 — Artilheiro",
      status: userId === 'admin_id' ? 'approved' : 'approved',
      is_admin: userId === 'admin_id' ? 1 : 0
    });
  }

  try {
    const user = await db.prepare('SELECT id, name, email, points, accuracy, global_rank, level_title, status, is_admin, notifications_enabled FROM users WHERE id = ?').bind(userId).first();
    if (!user) return c.json({ error: 'Usuário não encontrado' }, 404);

    return c.json(user);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 4. SAVE PREDICTION
app.post('/api/protected/predictions', async (c) => {
  const userId = c.get('userId');
  const { matchId, homeScore, awayScore } = await c.req.json();
  const db = c.env?.DB;

  if (!db) {
    return c.json({ success: true, message: 'Prediction saved in Mock Mode' });
  }

  try {
    // Check if user status is approved
    const user = await db.prepare('SELECT status FROM users WHERE id = ?').bind(userId).first();
    if (!user || user.status !== 'approved') {
      return c.json({ error: 'Sua conta ainda não foi liberada pelo administrador.' }, 403);
    }

    await db.prepare(
      `INSERT INTO predictions (user_id, match_id, home_score, away_score, updated_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, match_id) DO UPDATE SET 
       home_score = excluded.home_score, 
       away_score = excluded.away_score,
       updated_at = CURRENT_TIMESTAMP`
    ).bind(userId, matchId, homeScore, awayScore).run();

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 5. GET LEADERBOARD (Only Global Group remains)
app.get('/api/protected/rankings/:groupId', async (c) => {
  const db = c.env?.DB;

  if (!db) {
    return c.json({ error: 'Endpoint rankings disabled in Standalone Mock mode' });
  }

  try {
    const { results } = await db.prepare('SELECT name, points, accuracy, id FROM users WHERE status = \'approved\' ORDER BY points DESC LIMIT 100').all();
    return c.json(results);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// --- ADMIN SYSTEM ENDPOINTS ---

// 6. GET ALL USERS (Admin only)
app.get('/api/protected/admin/users', async (c) => {
  const userId = c.get('userId');
  const db = c.env?.DB;

  if (!db) {
    return c.json({ error: 'D1 not active' });
  }

  try {
    // Verify user is admin
    const caller = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first();
    if (!caller || caller.is_admin !== 1) {
      return c.json({ error: 'Acesso negado: Requer privilégios de administrador' }, 403);
    }

    const { results: allUsers } = await db.prepare('SELECT id, name, email, points, status, is_admin FROM users ORDER BY created_at DESC').all();
    return c.json(allUsers);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 7. TOGGLE USER STATUS (Admin only)
app.post('/api/protected/admin/users/toggle-status', async (c) => {
  const userId = c.get('userId');
  const { targetUserId, status } = await c.req.json();
  const db = c.env?.DB;

  if (!db) {
    return c.json({ success: true });
  }

  try {
    // Verify user is admin
    const caller = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first();
    if (!caller || caller.is_admin !== 1) {
      return c.json({ error: 'Acesso negado: Requer privilégios de administrador' }, 403);
    }

    await db.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, targetUserId).run();
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 8. UPDATE MATCH AND RECALCULATE POINTS (Admin only)
app.post('/api/protected/admin/matches/update', async (c) => {
  const userId = c.get('userId');
  const { matchId, homeTeam, homeAbbrev, homeFlag, awayTeam, awayAbbrev, awayFlag, homeScore, awayScore, status, time, startTime } = await c.req.json();
  const db = c.env?.DB;

  if (!db) {
    return c.json({ success: true, message: 'Match updated in Mock Mode' });
  }

  try {
    // Verify user is admin
    const caller = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first();
    if (!caller || caller.is_admin !== 1) {
      return c.json({ error: 'Acesso negado: Requer privilégios de administrador' }, 403);
    }

    const homeScoreVal = homeScore !== null && homeScore !== undefined && homeScore !== '' ? parseInt(homeScore) : null;
    const awayScoreVal = awayScore !== null && awayScore !== undefined && awayScore !== '' ? parseInt(awayScore) : null;
    const homeTeamVal = homeTeam !== undefined && homeTeam !== '' ? homeTeam : null;
    const homeAbbrevVal = homeAbbrev !== undefined && homeAbbrev !== '' ? homeAbbrev : null;
    const homeFlagVal = homeFlag !== undefined && homeFlag !== '' ? homeFlag : null;
    const awayTeamVal = awayTeam !== undefined && awayTeam !== '' ? awayTeam : null;
    const awayAbbrevVal = awayAbbrev !== undefined && awayAbbrev !== '' ? awayAbbrev : null;
    const awayFlagVal = awayFlag !== undefined && awayFlag !== '' ? awayFlag : null;
    const statusVal = status !== undefined && status !== '' ? status : null;
    const timeVal = time !== undefined && time !== '' ? time : null;
    const startTimeVal = startTime !== undefined && startTime !== '' ? startTime : null;

    // Update match info
    await db.prepare(
      `UPDATE matches SET 
        home_team = ?, home_abbrev = ?, home_flag = ?, 
        away_team = ?, away_abbrev = ?, away_flag = ?, 
        home_score = ?, away_score = ?, status = ?,
        time = ?, start_time = ?
       WHERE id = ?`
    ).bind(
      homeTeamVal, homeAbbrevVal, homeFlagVal, 
      awayTeamVal, awayAbbrevVal, awayFlagVal, 
      homeScoreVal, awayScoreVal, statusVal, 
      timeVal, startTimeVal, matchId
    ).run();

    // Recalculate Points, Accuracy, and Rankings for all users
    const { results: users } = await db.prepare("SELECT id FROM users").all();

    for (const u of users) {
      const { results: completedPredictions } = await db.prepare(
        `SELECT p.home_score as pred_home, p.away_score as pred_away, m.home_score as real_home, m.away_score as real_away 
         FROM predictions p 
         JOIN matches m ON p.match_id = m.id 
         WHERE p.user_id = ? AND m.status = 'completed'`
      ).bind(u.id).all();

      let points = 0;
      let correct = 0;
      const total = completedPredictions.length;

      for (const p of completedPredictions) {
        if (p.pred_home === p.real_home && p.pred_away === p.real_away) {
          points += 25; // Exact Match
          correct += 1;
        } else {
          const predResult = Math.sign(p.pred_home - p.pred_away);
          const realResult = Math.sign(p.real_home - p.real_away);
          if (predResult === realResult) {
            points += 10; // Winner/Draw correct
            correct += 1;
          }
        }
      }

      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Update user points and accuracy
      await db.prepare("UPDATE users SET points = ?, accuracy = ? WHERE id = ?").bind(points, accuracy, u.id).run();
    }

    // Recalculate global_rank based on points DESC
    const { results: sortedUsers } = await db.prepare("SELECT id FROM users ORDER BY points DESC, name ASC").all();
    for (let i = 0; i < sortedUsers.length; i++) {
      const rank = i + 1;
      await db.prepare("UPDATE users SET global_rank = ? WHERE id = ?").bind(rank, sortedUsers[i].id).run();
    }

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 9. DELETE MATCH (Admin only)
app.delete('/api/protected/admin/matches/:matchId', async (c) => {
  const userId = c.get('userId');
  const matchId = c.req.param('matchId');
  const db = c.env?.DB;

  if (!db) {
    return c.json({ success: true, message: 'Match deleted in Mock Mode' });
  }

  try {
    // Verify user is admin
    const caller = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first();
    if (!caller || caller.is_admin !== 1) {
      return c.json({ error: 'Acesso negado: Requer privilégios de administrador' }, 403);
    }

    // Delete match
    await db.prepare('DELETE FROM matches WHERE id = ?').bind(matchId).run();

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// --- CRON TRIGGER TRANSPARENCY BROADCASTER ---
async function handleCronTrigger(env) {
  const db = env.DB;
  if (!db) {
    console.log("Database binding missing on Scheduled Event.");
    return;
  }

  try {
    const { results: upcomingMatches } = await db.prepare(
      "SELECT * FROM matches WHERE start_time <= datetime('now', '+1 hour') AND email_sent = 0"
    ).all();

    if (upcomingMatches.length === 0) {
      return;
    }

    const { results: users } = await db.prepare("SELECT email, name FROM users WHERE status = 'approved'").all();
    const recipientEmails = users.map(u => u.email).filter(e => e && e.includes("@"));

    if (recipientEmails.length === 0) {
      return;
    }

    for (const match of upcomingMatches) {
      const { results: predictions } = await db.prepare(
        `SELECT u.name, p.home_score, p.away_score 
         FROM predictions p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.match_id = ?`
      ).bind(match.id).all();

      let predictionsListHtml = "";
      if (predictions.length === 0) {
        predictionsListHtml = "<p>Nenhum palpite foi cadastrado para esta partida.</p>";
      } else {
        predictionsListHtml = `
          <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; max-width: 500px; font-family: sans-serif; border-color: #ddd;">
            <thead>
              <tr style="background-color: #03122c; color: white;">
                <th style="text-align: left;">Participante</th>
                <th style="text-align: center;">Palpite</th>
              </tr>
            </thead>
            <tbody>
              ${predictions.map(p => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td style="text-align: center; font-size: 16px; color: #1e40af;">${p.home_score} x ${p.away_score}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      const emailHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #03122c;">Relatório de Transparência - Bolão 2026</h2>
          <p>Olá, Apostador!</p>
          <p>O grande confronto <strong>${match.home_team} ${match.home_flag} vs ${match.away_team} ${match.away_flag}</strong> começará em menos de 1 hora!</p>
          <p>Para garantir total transparência, aqui estão todos os palpites registrados por todos os participantes antes do início do jogo:</p>
          
          ${predictionsListHtml}
          
          <p style="margin-top: 24px; font-size: 12px; color: #777;">Este e-mail é gerado automaticamente pelo sistema de transparência do Bolão 2026.</p>
        </div>
      `;

      if (env.RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: "Bolao 2026 <transparencia@resend.dev>",
            to: recipientEmails,
            subject: `[Transparência] Palpites: ${match.home_team} x ${match.away_team}`,
            html: emailHtml
          })
        });

        if (res.ok) {
          await db.prepare("UPDATE matches SET email_sent = 1 WHERE id = ?").bind(match.id).run();
        }
      } else {
        await db.prepare("UPDATE matches SET email_sent = 1 WHERE id = ?").bind(match.id).run();
      }
    }
  } catch (e) {
    console.error("Erro no Scheduled Event: ", e);
  }
}

// --- EXPORT FETCH & SCHEDULED WRAPPERS ---
export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCronTrigger(env));
  }
};
