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
app.use('/api/protected/*', jwt({ secret: JWT_SECRET }));
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
      return c.json({
        message: 'Mock register success (Standalone Mode)',
        token: 'mock-jwt-token-12345',
        user: { id: 'mock_u1', name, email, points: 0, accuracy: 0 }
      });
    }

    const userId = generateId();
    await db.prepare(
      'INSERT INTO users (id, name, email, password_hash, points, accuracy, global_rank) VALUES (?, ?, ?, ?, 0, 0, 9999)'
    ).bind(userId, name, email, password).run();

    const token = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + (3600 * 24 * 7) }, JWT_SECRET);

    return c.json({
      token,
      user: { id: userId, name, email, points: 0, accuracy: 0 }
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
      if (email === 'pedro@bolao.com' && password === '123456') {
        return c.json({
          token: 'mock-jwt-token-12345',
          user: { id: 'pedro_mock_id', name: 'Pedro Alcântara', email, points: 1240, accuracy: 68 }
        });
      }
      return c.json({ error: 'Credenciais inválidas no modo Mock' }, 401);
    }

    const user = await db.prepare(
      'SELECT id, name, email, password_hash, points, accuracy, global_rank, level_title, notifications_enabled FROM users WHERE email = ?'
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
    // Return mock static matches
    return c.json([
      { id: "m1", homeTeam: "Brasil", homeAbbrev: "BRA", homeFlag: "🇧🇷", awayTeam: "EUA", awayAbbrev: "USA", awayFlag: "🇺🇸", status: "live", time: "15 JUN • 21:00", homeScore: 1, awayScore: 0, realTimeMinute: 62 },
      { id: "m2", homeTeam: "Argentina", homeAbbrev: "ARG", homeFlag: "🇦🇷", awayTeam: "França", awayAbbrev: "FRA", awayFlag: "🇫🇷", status: "upcoming", time: "16 JUN • 16:00", homeScore: null, awayScore: null },
      { id: "m3", homeTeam: "Alemanha", homeAbbrev: "GER", homeFlag: "🇩🇪", awayTeam: "Espanha", awayAbbrev: "ESP", awayFlag: "🇪🇸", status: "upcoming", time: "17 JUN • 19:00", homeScore: null, awayScore: null },
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

// --- PROTECTED ENDPOINTS ---

// 3. PROFILE DATA
app.get('/api/protected/me', async (c) => {
  const userId = c.get('userId');
  const db = c.env?.DB;

  if (!db) {
    return c.json({
      id: userId,
      name: "Pedro Alcântara",
      email: "pedro@bolao.com",
      points: 1240,
      accuracy: 68,
      globalRank: 42,
      levelTitle: "Nível 24 — Artilheiro",
      groups: [
        { id: "g1", name: "Firma & Breja", rank: 4, total: 12 },
        { id: "g2", name: "Família Silva", rank: 1, total: 6 }
      ]
    });
  }

  try {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) return c.json({ error: 'Usuário não encontrado' }, 404);

    const { results: groups } = await db.prepare(
      `SELECT g.id, g.name, 
      (SELECT COUNT(*)+1 FROM users u2 WHERE u2.points > u.points) as rank,
      (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) as total
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON u.id = ?
      WHERE gm.user_id = ?`
    ).bind(userId, userId).all();

    return c.json({
      ...user,
      groups
    });
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

// 5. CREATE GROUP
app.post('/api/protected/groups/create', async (c) => {
  const userId = c.get('userId');
  const { name } = await c.req.json();
  const db = c.env?.DB;

  if (!db) {
    return c.json({ success: true, groupId: 'mock-g-' + Date.now(), inviteCode: 'MOCK123' });
  }

  try {
    const groupId = generateId();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await db.batch([
      db.prepare('INSERT INTO groups (id, name, invite_code, created_by) VALUES (?, ?, ?, ?)').bind(groupId, name, inviteCode, userId),
      db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').bind(groupId, userId)
    ]);

    return c.json({ success: true, groupId, inviteCode });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 6. JOIN GROUP
app.post('/api/protected/groups/join', async (c) => {
  const userId = c.get('userId');
  const { inviteCode } = await c.req.json();
  const db = c.env?.DB;

  if (!db) {
    return c.json({ success: true, groupName: 'Grupo Mock Amigo' });
  }

  try {
    const group = await db.prepare('SELECT id, name FROM groups WHERE invite_code = ?').bind(inviteCode).first();
    if (!group) {
      return c.json({ error: 'Código de convite não encontrado' }, 404);
    }

    await db.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)').bind(group.id, userId).run();

    return c.json({ success: true, groupName: group.name });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 7. GET LEADERBOARD
app.get('/api/protected/rankings/:groupId', async (c) => {
  const groupId = c.req.param('groupId');
  const db = c.env?.DB;

  if (!db) {
    return c.json({ error: 'Endpoint rankings disabled in Standalone Mock mode' });
  }

  try {
    let query = '';
    let binding = [];

    if (groupId === 'global') {
      query = 'SELECT name, points, accuracy, id FROM users ORDER BY points DESC LIMIT 100';
    } else {
      query = `
        SELECT u.name, u.points, u.accuracy, u.id 
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY u.points DESC
      `;
      binding = [groupId];
    }

    const { results } = await db.prepare(query).bind(...binding).all();
    return c.json(results);
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
    // 1. Fetch matches starting within the next 1 hour that haven't sent the email
    const { results: upcomingMatches } = await db.prepare(
      "SELECT * FROM matches WHERE start_time <= datetime('now', '+1 hour') AND email_sent = 0"
    ).all();

    if (upcomingMatches.length === 0) {
      console.log("Nenhuma partida programada para a próxima 1 hora.");
      return;
    }

    // 2. Fetch all user emails to broadcast to
    const { results: users } = await db.prepare("SELECT email, name FROM users").all();
    const recipientEmails = users.map(u => u.email).filter(e => e && e.includes("@"));

    if (recipientEmails.length === 0) {
      console.log("Nenhum destinatário de e-mail cadastrado.");
      return;
    }

    for (const match of upcomingMatches) {
      // 3. Get all predictions for this match
      const { results: predictions } = await db.prepare(
        `SELECT u.name, p.home_score, p.away_score 
         FROM predictions p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.match_id = ?`
      ).bind(match.id).all();

      // 4. Build email HTML body
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
          
          <p style="margin-top: 24px; font-size: 12px; color: #777;">Este e-mail é gerado automaticamente pelo sistema de auditoria do Bolão 2026.</p>
        </div>
      `;

      // 5. Send emails via Resend API
      if (env.RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: "Bolao 2026 <transparencia@resend.dev>", // Needs verified domain on Resend, or using their default sandbox address
            to: recipientEmails,
            subject: `[Transparência] Palpites: ${match.home_team} x ${match.away_team}`,
            html: emailHtml
          })
        });

        if (res.ok) {
          console.log(`E-mail de transparência enviado para ${recipientEmails.length} usuários para a partida ${match.id}`);
          // Mark email as sent
          await db.prepare("UPDATE matches SET email_sent = 1 WHERE id = ?").bind(match.id).run();
        } else {
          const errText = await res.text();
          console.error(`Erro ao disparar Resend API: ${errText}`);
        }
      } else {
        // Mock fallback log
        console.log("===== MOCK EMAIL BROADCAST =====");
        console.log(`Destinatários: ${recipientEmails.join(", ")}`);
        console.log(`Assunto: [Transparência] Palpites: ${match.home_team} x ${match.away_team}`);
        console.log(emailHtml);
        console.log("================================");
        
        // Local simulation: Mark as sent anyway
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
