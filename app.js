/* ==========================================================================
   BOLÃO COPA 2026 - APPLICATION LOGIC WITH API & AUTH ENTITY
   ========================================================================== */

// --- DUAL MODE CONFIGURATION ---
const API_BASE_URL = "http://localhost:8787"; 
let isApiActive = false; // Toggled dynamically on initial connection check

// Mock database inside LocalStorage for fallback testing
const DEFAULT_MOCK_USERS_DB = [
  {
    id: "pedro_mock_id",
    name: "Pedro Alcântara",
    email: "pedro@bolao.com",
    password: "123456",
    points: 1240,
    accuracy: 68,
    globalRank: 42,
    groups: [
      { id: "g1", name: "Firma & Breja", rank: 4, total: 12 },
      { id: "g2", name: "Família Silva", rank: 1, total: 6 }
    ],
    levelTitle: "Nível 24 — Artilheiro",
    notificationsEnabled: true
  }
];

// --- INITIAL STATE ---
const DEFAULT_STATE = {
  user: null, // Populated after login
  predictions: {}, 
  matches: [
    {
      id: "m1",
      homeTeam: "Brasil",
      homeAbbrev: "BRA",
      homeFlag: "🇧🇷",
      awayTeam: "EUA",
      awayAbbrev: "USA",
      awayFlag: "🇺🇸",
      status: "live",
      time: "15 JUN • 21:00",
      homeScore: 1,
      awayScore: 0,
      realTimeMinute: 62,
      resultCalculated: false
    },
    {
      id: "m2",
      homeTeam: "Argentina",
      homeAbbrev: "ARG",
      homeFlag: "🇦🇷",
      awayTeam: "França",
      awayAbbrev: "FRA",
      awayFlag: "🇫🇷",
      status: "upcoming",
      time: "16 JUN • 16:00",
      homeScore: null,
      awayScore: null
    },
    {
      id: "m3",
      homeTeam: "Alemanha",
      homeAbbrev: "GER",
      homeFlag: "🇩🇪",
      awayTeam: "Espanha",
      awayAbbrev: "ESP",
      awayFlag: "🇪🇸",
      status: "upcoming",
      time: "17 JUN • 19:00",
      homeScore: null,
      awayScore: null
    },
    {
      id: "m4",
      homeTeam: "Itália",
      homeAbbrev: "ITA",
      homeFlag: "🇮🇹",
      awayTeam: "Inglaterra",
      awayAbbrev: "ENG",
      awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      status: "completed",
      time: "14 JUN • Finalizado",
      homeScore: 2,
      awayScore: 1
    }
  ],
  rankings: {
    global: [
      { name: "Rodrigo 'The King'", avatar: "avatar1.jpg", points: 1580, trend: "up", isCurrentUser: false },
      { name: "Ana Cláudia", avatar: "avatar2.jpg", points: 1520, trend: "same", isCurrentUser: false },
      { name: "Bruno Santos", avatar: "avatar.jpg", points: 1390, trend: "down", isCurrentUser: false },
      { name: "Pedro Alcântara", avatar: "avatar.jpg", points: 1240, trend: "up", isCurrentUser: true },
      { name: "Mariana Costa", avatar: "avatar2.jpg", points: 1100, trend: "same", isCurrentUser: false }
    ],
    g1: [
      { name: "Bruno Santos", avatar: "avatar.jpg", points: 1390, trend: "same", isCurrentUser: false },
      { name: "Lucas Lima", avatar: "avatar1.jpg", points: 1310, trend: "up", isCurrentUser: false },
      { name: "Carla Mendes", avatar: "avatar2.jpg", points: 1280, trend: "down", isCurrentUser: false },
      { name: "Pedro Alcântara", avatar: "avatar.jpg", points: 1240, trend: "up", isCurrentUser: true },
      { name: "Tiago Souza", avatar: "avatar1.jpg", points: 1190, trend: "same", isCurrentUser: false }
    ],
    g2: [
      { name: "Pedro Alcântara", avatar: "avatar.jpg", points: 1240, trend: "same", isCurrentUser: true },
      { name: "Vovô Silva", avatar: "avatar1.jpg", points: 1150, trend: "up", isCurrentUser: false },
      { name: "Tia Maria", avatar: "avatar2.jpg", points: 1080, trend: "down", isCurrentUser: false }
    ]
  }
};

let state = {};

// --- LOCAL STORAGE HELPERS ---
function loadMockUsersDB() {
  const db = localStorage.getItem("bolao_mock_users_db");
  if (!db) {
    localStorage.setItem("bolao_mock_users_db", JSON.stringify(DEFAULT_MOCK_USERS_DB));
    return DEFAULT_MOCK_USERS_DB;
  }
  return JSON.parse(db);
}

function saveMockUsersDB(db) {
  localStorage.setItem("bolao_mock_users_db", JSON.stringify(db));
}

function loadState() {
  const saved = localStorage.getItem("bolao_2026_state");
  if (saved) {
    try {
      state = JSON.parse(saved);
      state.matches = DEFAULT_STATE.matches.map(defaultMatch => {
        const savedMatch = state.matches.find(m => m.id === defaultMatch.id);
        return savedMatch ? { ...defaultMatch, ...savedMatch } : defaultMatch;
      });
    } catch (e) {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  } else {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState() {
  localStorage.setItem("bolao_2026_state", JSON.stringify(state));
}

// --- DOM ELEMENTS ---
const appShellContainer = document.getElementById("app-shell-container");
const authScreenPanel = document.getElementById("auth-screen-panel");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authToggleBtn = document.getElementById("auth-toggle-btn");
const authToggleLabel = document.getElementById("auth-toggle-label");
const authNameGroup = document.getElementById("auth-name-group");
const authNameInput = document.getElementById("auth-name-input");
const authEmailInput = document.getElementById("auth-email-input");
const authPassInput = document.getElementById("auth-pass-input");
const sandboxIndicator = document.querySelector(".sandbox-indicator");

// Tabs & Views
const viewPanels = document.querySelectorAll(".view-panel");
const navTabs = document.querySelectorAll(".nav-tab");
const welcomeName = document.getElementById("welcome-name");
const homeTotalPoints = document.getElementById("home-total-points");
const homeAccuracy = document.getElementById("home-accuracy");
const matchesListContainer = document.getElementById("matches-list-container");
const rankingGroupSelect = document.getElementById("ranking-group-select");
const fullLeaderboardList = document.getElementById("full-leaderboard-list");
const homeRankingPreviewContainer = document.getElementById("home-ranking-preview-container");
const groupsListContainer = document.getElementById("groups-list-container");
const toastContainer = document.getElementById("toast-container");
const notificationBadge = document.getElementById("notification-badge");

// Profile tab fields
const profileDisplayName = document.getElementById("profile-display-name");
const profileLevelTitle = document.getElementById("profile-level-title");
const profilePoints = document.getElementById("profile-points");
const profileAccuracy = document.getElementById("profile-accuracy");
const profileGlobalRank = document.getElementById("profile-global-rank");
const profileGroupsCount = document.getElementById("profile-groups-count");

// Modals
const predictionModal = document.getElementById("prediction-modal");
const profileModal = document.getElementById("profile-modal");
const groupModal = document.getElementById("group-modal");

// Predict modal fields
const modalHomeFlag = document.getElementById("modal-home-flag");
const modalHomeName = document.getElementById("modal-home-name");
const modalHomeScore = document.getElementById("modal-home-score");
const modalAwayFlag = document.getElementById("modal-away-flag");
const modalAwayName = document.getElementById("modal-away-name");
const modalAwayScore = document.getElementById("modal-away-score");

let currentEditingMatchId = null;
let isSignupMode = false;

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;
  toastContainer.appendChild(toast);

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.remove();
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = "fadeIn 0.2s reverse ease";
      setTimeout(() => toast.remove(), 200);
    }
  }, 4000);
}

// --- NETWORK API HELPERS ---
async function checkBackendConnectivity() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test", password: "test" })
    });
    // If we reach this far without a TypeError, server is up.
    isApiActive = true;
    sandboxIndicator.style.display = "none";
    console.log("Cloudflare Workers API Active. API Mode enabled.");
  } catch (e) {
    isApiActive = false;
    sandboxIndicator.style.display = "block";
    console.log("Cloudflare Workers API Offline. Standalone Local Storage Mock Mode enabled.");
  }
}

async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("bolao_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Erro na chamada de API");
  }
  return data;
}

// --- STATE SYNCING ROUTINES (API VS LOCAL FALLBACK) ---
async function syncSavePrediction(matchId, homeScore, awayScore) {
  state.predictions[matchId] = { homeScore, awayScore };
  saveState();

  if (isApiActive) {
    try {
      await apiRequest("/api/protected/predictions", "POST", { matchId, homeScore, awayScore });
    } catch (err) {
      console.warn("API Sync failed, stored locally", err);
    }
  }
}

async function syncCreateGroup(name) {
  const newGroupId = `g_${Date.now()}`;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newGroup = {
    id: newGroupId,
    name: name,
    rank: 1,
    total: 1
  };
  
  state.user.groups.push(newGroup);
  
  // Add current user to group ranking list locally
  state.rankings[newGroupId] = [
    { name: state.user.name, avatar: state.user.avatar, points: state.user.points, trend: "same", isCurrentUser: true }
  ];
  
  saveState();

  if (isApiActive) {
    try {
      const data = await apiRequest("/api/protected/groups/create", "POST", { name });
      // Update local storage IDs with real server ones if synced
      if (data.groupId) {
        newGroup.id = data.groupId;
        saveState();
      }
    } catch (err) {
      console.warn("API Group creation failed, saved locally", err);
    }
  }

  return { groupId: newGroup.id, inviteCode };
}

// --- AUTHENTICATION FLOW (LOGIN/SIGNUP) ---
async function handleAuthSubmit() {
  const email = authEmailInput.value.trim();
  const password = authPassInput.value.trim();
  const name = authNameInput.value.trim();

  if (!email || !password || (isSignupMode && !name)) {
    showToast("Por favor, preencha todos os campos necessários.", "warning");
    return;
  }

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = "PROCESSANDO...";

  try {
    if (isApiActive) {
      // Connect to Cloudflare Worker
      if (isSignupMode) {
        const data = await apiRequest("/api/auth/register", "POST", { name, email, password });
        localStorage.setItem("bolao_auth_token", data.token);
        state.user = {
          name: name,
          avatar: "avatar.jpg",
          points: 0,
          accuracy: 0,
          globalRank: 999,
          groups: [],
          levelTitle: "Nível 1 — Estreante",
          notificationsEnabled: true
        };
      } else {
        const data = await apiRequest("/api/auth/login", "POST", { email, password });
        localStorage.setItem("bolao_auth_token", data.token);
        state.user = data.user;
      }
    } else {
      // Standalone LocalStorage Emulation
      const usersDB = loadMockUsersDB();
      
      if (isSignupMode) {
        // Register locally
        if (usersDB.some(u => u.email === email)) {
          throw new Error("E-mail já cadastrado.");
        }
        
        const newMockId = `mock_${Date.now()}`;
        const newMockUser = {
          id: newMockId,
          name: name,
          email: email,
          password: password,
          points: 0,
          accuracy: 0,
          globalRank: 50,
          groups: [],
          levelTitle: "Nível 1 — Estreante",
          notificationsEnabled: true
        };
        
        usersDB.push(newMockUser);
        saveMockUsersDB(usersDB);
        
        localStorage.setItem("bolao_auth_token", "mock-token-" + newMockId);
        state.user = newMockUser;
      } else {
        // Login locally
        const found = usersDB.find(u => u.email === email && u.password === password);
        if (!found) {
          throw new Error("E-mail ou senha inválidos.");
        }
        
        localStorage.setItem("bolao_auth_token", "mock-token-" + found.id);
        state.user = found;
      }
    }

    // Success Authentication sequence
    saveState();
    appShellContainer.classList.remove("auth-required");
    showToast(`Bem-vindo, ${state.user.name}!`, "success");
    
    // Initialize UI Panels
    initAppContent();
  } catch (err) {
    showToast(err.message || "Erro na autenticação", "danger");
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignupMode ? "CADASTRAR" : "ENTRAR";
  }
}

function handleLogout() {
  if (confirm("Deseja mesmo sair da sua conta?")) {
    localStorage.removeItem("bolao_auth_token");
    localStorage.removeItem("bolao_2026_state");
    state.user = null;
    appShellContainer.classList.add("auth-required");
    authEmailInput.value = "";
    authPassInput.value = "";
    authNameInput.value = "";
    showToast("Sessão encerrada.", "info");
  }
}

// --- SPA VIEW NAVIGATION ---
function switchTab(targetViewId) {
  viewPanels.forEach(panel => {
    panel.classList.remove("active");
  });
  
  const targetPanel = document.getElementById(targetViewId);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  navTabs.forEach(tab => {
    if (tab.dataset.target === targetViewId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  const main = document.querySelector(".app-main");
  if (main) main.scrollTop = 0;
}

// --- UI RENDERING METHODS ---
function updateProfileUI() {
  const u = state.user;
  if (!u) return;

  const pointsFormatted = new Intl.NumberFormat('pt-BR').format(u.points);
  
  welcomeName.textContent = "Seu Desempenho";
  homeTotalPoints.textContent = pointsFormatted;
  homeAccuracy.textContent = `${u.accuracy}%`;

  // Profile fields
  profileDisplayName.textContent = u.name;
  profileLevelTitle.textContent = u.levelTitle || "Nível 1 — Estreante";
  profilePoints.textContent = pointsFormatted;
  profileAccuracy.textContent = `${u.accuracy}%`;
  profileGlobalRank.textContent = `#${u.globalRank || 999}`;
  profileGroupsCount.textContent = (u.groups?.length || 0) + 2; 

  const notifStateLabel = document.getElementById("notif-state-label");
  if (notifStateLabel) {
    notifStateLabel.textContent = u.notificationsEnabled ? "Ligado" : "Desligado";
  }
}

function renderGroups() {
  const createCard = document.getElementById("create-group-card-btn");
  groupsListContainer.innerHTML = "";
  
  const groupsList = state.user?.groups || [];
  groupsList.forEach(g => {
    const card = document.createElement("div");
    card.className = "group-circle-card ripple";
    card.dataset.groupId = g.id;
    card.innerHTML = `
      <div class="group-icon-holder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </div>
      <span class="group-circle-name">${g.name}</span>
      <span class="group-circle-rank">${g.rank}º de ${g.total}</span>
    `;
    
    card.addEventListener("click", () => {
      rankingGroupSelect.value = g.id;
      renderLeaderboard(g.id);
      switchTab("view-ranking");
    });
    
    groupsListContainer.appendChild(card);
  });
  
  groupsListContainer.appendChild(createCard);
}

function renderLeaderboard(groupId = "global") {
  let rankingList = state.rankings[groupId] || [];
  
  fullLeaderboardList.innerHTML = "";
  
  // Update current user points inside this list for visual feedback
  const userRankItem = rankingList.find(item => item.isCurrentUser);
  if (userRankItem && state.user) {
    userRankItem.points = state.user.points;
    userRankItem.name = state.user.name;
  } else if (!userRankItem && state.user) {
    // Add current user if not present
    rankingList.push({
      name: state.user.name,
      avatar: "avatar.jpg",
      points: state.user.points,
      trend: "up",
      isCurrentUser: true
    });
  }
  
  rankingList.sort((a, b) => b.points - a.points);
  
  rankingList.forEach((player, index) => {
    const pos = index + 1;
    let trendIcon = "";
    if (player.trend === "up") {
      trendIcon = `<svg class="ranking-trend-icon trend-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
    } else if (player.trend === "down") {
      trendIcon = `<svg class="ranking-trend-icon trend-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>`;
    } else {
      trendIcon = `<span style="font-size: 14px; font-weight: bold; color: var(--color-secondary);">—</span>`;
    }
    
    let posClass = "";
    if (pos === 1) posClass = "pos-1";
    else if (pos === 2) posClass = "pos-2";
    else if (pos === 3) posClass = "pos-3";

    const row = document.createElement("div");
    row.className = `leaderboard-row ${player.isCurrentUser ? 'current-user' : ''}`;
    row.innerHTML = `
      <span class="leaderboard-cell-rank ${posClass}">${pos}</span>
      <div class="leaderboard-cell-user">
        <div class="leaderboard-cell-avatar">
          <img src="public/${player.avatar || 'avatar.jpg'}" alt="${player.name}">
        </div>
        <span class="leaderboard-cell-name">${player.name}</span>
      </div>
      <span class="leaderboard-cell-points">${new Intl.NumberFormat('pt-BR').format(player.points)}</span>
      <div class="leaderboard-cell-trend">${trendIcon}</div>
    `;
    fullLeaderboardList.appendChild(row);
  });
}

function renderHomeRankingPreview() {
  const rankingList = [...(state.rankings.global || [])];
  rankingList.sort((a, b) => b.points - a.points);
  
  const top2 = rankingList.slice(0, 2);
  homeRankingPreviewContainer.innerHTML = "";
  
  top2.forEach((player, index) => {
    const pos = index + 1;
    let trendIcon = "";
    if (player.trend === "up") {
      trendIcon = `<svg class="ranking-trend-icon trend-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
    } else if (player.trend === "down") {
      trendIcon = `<svg class="ranking-trend-icon trend-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>`;
    } else {
      trendIcon = `<span style="font-size: 14px; font-weight: bold; color: var(--color-secondary);">—</span>`;
    }
    
    let posClass = "";
    if (pos === 1) posClass = "pos-1";
    else if (pos === 2) posClass = "pos-2";

    const card = document.createElement("div");
    card.className = "ranking-row";
    card.innerHTML = `
      <div class="ranking-left">
        <span class="ranking-pos ${posClass}">${pos}</span>
        <div class="ranking-avatar">
          <img src="public/${player.avatar || 'avatar.jpg'}" alt="${player.name}">
        </div>
        <div>
          <div class="ranking-name">${player.name}</div>
          <div class="ranking-points">${new Intl.NumberFormat('pt-BR').format(player.points)} PTS</div>
        </div>
      </div>
      <div>${trendIcon}</div>
    `;
    
    card.addEventListener("click", () => {
      rankingGroupSelect.value = "global";
      renderLeaderboard("global");
      switchTab("view-ranking");
    });
    
    homeRankingPreviewContainer.appendChild(card);
  });
}

function renderMatchesList(filter = "all") {
  matchesListContainer.innerHTML = "";
  
  const filteredMatches = state.matches.filter(m => {
    if (filter === "pending") {
      return m.status === "upcoming" || (m.status === "live" && !state.predictions[m.id]);
    }
    if (filter === "completed") {
      return m.status === "completed";
    }
    return true;
  });
  
  if (filteredMatches.length === 0) {
    matchesListContainer.innerHTML = `<div class="empty-state" style="text-align: center; color: var(--color-secondary); padding: 40px 20px;">Nenhuma partida encontrada para este filtro.</div>`;
    return;
  }
  
  filteredMatches.forEach(m => {
    const card = document.createElement("div");
    card.className = "match-card";
    card.dataset.matchId = m.id;
    
    let statusLabel = "";
    if (m.status === "live") {
      statusLabel = `<span class="match-status-label live">● AO VIVO (${m.realTimeMinute}')</span>`;
    } else if (m.status === "completed") {
      statusLabel = `<span class="match-status-label">FINALIZADO</span>`;
    } else {
      statusLabel = `<span class="match-status-label">${m.time}</span>`;
    }
    
    const userPred = state.predictions[m.id];
    let predictionBarHtml = "";
    
    if (m.status === "completed") {
      if (userPred) {
        const gainedPoints = getPointsAwarded(userPred.homeScore, userPred.awayScore, m.homeScore, m.awayScore);
        predictionBarHtml = `
          <div class="match-prediction-bar">
            <span class="pred-label">Seu Palpite: <strong style="color:white;">${userPred.homeScore} x ${userPred.awayScore}</strong></span>
            <span class="prediction-points-badge">+${gainedPoints} PTS</span>
          </div>
        `;
      } else {
        predictionBarHtml = `
          <div class="match-prediction-bar">
            <span class="pred-label pred-empty">Sem palpite registrado</span>
            <span class="prediction-points-badge" style="background:rgba(239, 68, 68, 0.15); color:var(--color-danger); border-color:rgba(239,68,68,0.3)">+0 PTS</span>
          </div>
        `;
      }
    } else {
      if (userPred) {
        predictionBarHtml = `
          <div class="match-prediction-bar">
            <span class="pred-label">Seu Palpite:</span>
            <span class="pred-value">${userPred.homeScore} x ${userPred.awayScore}</span>
          </div>
        `;
      } else {
        predictionBarHtml = `
          <div class="match-prediction-bar">
            <span class="pred-label pred-empty">Sem palpite</span>
            <button class="btn btn-primary btn-gold" style="padding: 4px 10px; font-size: 10px; border-radius: 6px;">Palpitar</button>
          </div>
        `;
      }
    }

    const homeScoreDisplay = m.homeScore !== null ? m.homeScore : "-";
    const awayScoreDisplay = m.awayScore !== null ? m.awayScore : "-";

    card.innerHTML = `
      <div class="match-card-header">
        <span>Copa do Mundo 2026</span>
        ${statusLabel}
      </div>
      <div class="match-score-row">
        <div class="match-team">
          <span class="match-team-flag">${m.homeFlag}</span>
          <span class="match-team-name">${m.homeTeam}</span>
        </div>
        <div class="match-scores-middle">
          <span>${homeScoreDisplay}</span>
          <span class="actual-score">VS</span>
          <span>${awayScoreDisplay}</span>
        </div>
        <div class="match-team team-away">
          <span class="match-team-name">${m.awayTeam}</span>
          <span class="match-team-flag">${m.awayFlag}</span>
        </div>
      </div>
      ${predictionBarHtml}
    `;
    
    if (m.status !== "completed") {
      card.addEventListener("click", () => {
        openPredictionModal(m.id);
      });
    }
    
    matchesListContainer.appendChild(card);
  });
}

function updateFeaturedMatchCard() {
  const featured = state.matches.find(m => m.status === "live") || state.matches[0];
  if (!featured) return;
  
  const statusBadge = document.getElementById("featured-status-badge");
  if (featured.status === "live") {
    statusBadge.textContent = `● AO VIVO (${featured.realTimeMinute}')`;
    statusBadge.style.display = "block";
  } else if (featured.status === "completed") {
    statusBadge.textContent = "FINALIZADO";
    statusBadge.style.display = "block";
  } else {
    statusBadge.style.display = "none";
  }

  document.getElementById("featured-home-flag").textContent = featured.homeFlag;
  document.getElementById("featured-home-abbrev").textContent = featured.homeAbbrev;
  document.getElementById("featured-away-flag").textContent = featured.awayFlag;
  document.getElementById("featured-away-abbrev").textContent = featured.awayAbbrev;
  
  const formattedTime = featured.status === "live" 
    ? `Placar Atual: ${featured.homeScore} x ${featured.awayScore}` 
    : featured.time;
    
  document.getElementById("featured-match-time").textContent = formattedTime;
  
  const featuredBtn = document.getElementById("featured-palpitar-btn");
  if (featured.status === "completed") {
    featuredBtn.innerHTML = `VER DETALHES <span class="arrow">→</span>`;
  } else {
    const userPred = state.predictions[featured.id];
    if (userPred) {
      featuredBtn.innerHTML = `PALPITE: ${userPred.homeScore} x ${userPred.awayScore} (Editar) <span class="arrow">→</span>`;
    } else {
      featuredBtn.innerHTML = `PALPITAR AGORA <span class="arrow">→</span>`;
    }
  }
}

function getPointsAwarded(predHome, predAway, realHome, realAway) {
  if (predHome === null || predAway === null || realHome === null || realAway === null) return 0;
  
  const pHome = parseInt(predHome);
  const pAway = parseInt(predAway);
  const rHome = parseInt(realHome);
  const rAway = parseInt(realAway);
  
  if (pHome === rHome && pAway === rAway) {
    return 25; // Perfect
  }
  
  const predDiff = pHome - pAway;
  const realDiff = rHome - rAway;
  
  if ((predDiff > 0 && realDiff > 0) || (predDiff < 0 && realDiff < 0) || (predDiff === 0 && realDiff === 0)) {
    return 10; // Winner/Draw outcome correct
  }
  
  return 0;
}

// --- MODALS OPEN/CLOSE ---
function openPredictionModal(matchId) {
  const m = state.matches.find(item => item.id === matchId);
  if (!m) return;
  
  currentEditingMatchId = matchId;
  modalHomeFlag.textContent = m.homeFlag;
  modalHomeName.textContent = m.homeTeam;
  modalAwayFlag.textContent = m.awayFlag;
  modalAwayName.textContent = m.awayTeam;
  
  const userPred = state.predictions[matchId];
  if (userPred) {
    modalHomeScore.value = userPred.homeScore;
    modalAwayScore.value = userPred.awayScore;
  } else {
    modalHomeScore.value = "";
    modalAwayScore.value = "";
  }
  
  predictionModal.classList.add("open");
}

function closeAllModals() {
  predictionModal.classList.remove("open");
  profileModal.classList.remove("open");
  groupModal.classList.remove("open");
  currentEditingMatchId = null;
}

// --- GAME LOGIC MATCH SCORE SIMULATOR ---
function simulateLiveMatchTick() {
  const liveMatch = state.matches.find(m => m.id === "m1");
  if (!liveMatch || liveMatch.status !== "live") return;
  
  liveMatch.realTimeMinute += 1;
  
  if (liveMatch.realTimeMinute === 74) {
    liveMatch.homeScore = 2;
    showToast("⚽ GOL DO BRASIL! Pedro Neto amplia o placar! Brasil 2 x 0 EUA", "success");
    notificationBadge.style.display = "block";
    saveState();
    updateFeaturedMatchCard();
    renderMatchesList(document.querySelector(".filter-tab.active").dataset.filter);
  } else if (liveMatch.realTimeMinute === 85) {
    liveMatch.awayScore = 1;
    showToast("⚽ GOL DOS EUA! Pulisic desconta de pênalti! Brasil 2 x 1 EUA", "warning");
    notificationBadge.style.display = "block";
    saveState();
    updateFeaturedMatchCard();
    renderMatchesList(document.querySelector(".filter-tab.active").dataset.filter);
  } else if (liveMatch.realTimeMinute >= 90 && !liveMatch.resultCalculated) {
    liveMatch.status = "completed";
    liveMatch.time = "15 JUN • Finalizado";
    liveMatch.resultCalculated = true;
    showToast("🏁 FIM DE JOGO! Brasil 2 x 1 EUA. Pontuações do bolão computadas!", "info");
    notificationBadge.style.display = "block";
    
    // Add points if predicted
    const pred = state.predictions["m1"];
    if (pred) {
      const pts = getPointsAwarded(pred.homeScore, pred.awayScore, liveMatch.homeScore, liveMatch.awayScore);
      state.user.points += pts;
      if (pts === 25) {
        showToast("🔥 Placar exato! Você ganhou +25 pontos no bolão!", "success");
      } else if (pts === 10) {
        showToast("👍 Acertou o vencedor! Você ganhou +10 pontos!", "success");
      } else {
        showToast("❌ Você errou o palpite de Brasil x EUA. 0 pontos.", "danger");
      }
    }
    
    saveState();
    updateProfileUI();
    renderLeaderboard(rankingGroupSelect.value);
    renderHomeRankingPreview();
    updateFeaturedMatchCard();
    renderMatchesList(document.querySelector(".filter-tab.active").dataset.filter);
  } else {
    saveState();
    updateFeaturedMatchCard();
    if (document.getElementById("view-palpites").classList.contains("active")) {
      renderMatchesList(document.querySelector(".filter-tab.active").dataset.filter);
    }
  }
}

// --- LOAD MATCHES DATA FROM API ---
async function loadMatchesData() {
  if (isApiActive) {
    try {
      const dbMatches = await apiRequest("/api/matches");
      state.matches = dbMatches.map(m => ({
        id: m.id,
        homeTeam: m.home_team,
        homeAbbrev: m.home_abbrev,
        homeFlag: m.home_flag,
        awayTeam: m.away_team,
        awayAbbrev: m.away_abbrev,
        awayFlag: m.away_flag,
        status: m.status,
        time: m.time,
        homeScore: m.home_score,
        awayScore: m.away_score,
        realTimeMinute: m.id === "m1" ? 62 : null,
        resultCalculated: m.id === "m1" ? (m.home_score >= 2) : false
      }));
    } catch (e) {
      console.warn("Could not load matches from API, using cached/local matches", e);
    }
  }
}

// --- RENDER APP SCREEN AFTER LOGGED IN ---
async function initAppContent() {
  await loadMatchesData();
  updateProfileUI();
  renderGroups();
  renderLeaderboard("global");
  renderHomeRankingPreview();
  updateFeaturedMatchCard();
  renderMatchesList("all");

  // Populate ranking options
  state.user.groups.forEach(g => {
    if (![...rankingGroupSelect.options].some(opt => opt.value === g.id)) {
      const option = document.createElement("option");
      option.value = g.id;
      option.textContent = `Grupo: ${g.name}`;
      rankingGroupSelect.appendChild(option);
    }
  });

  // Set initial header avatar
  document.getElementById("header-avatar-img").src = `public/${state.user.avatar || 'avatar.jpg'}`;
  document.getElementById("profile-avatar-large").src = `public/${state.user.avatar || 'avatar.jpg'}`;
}

// --- INITIALIZE LISTENERS ---
function initEventListeners() {
  // Auth Form Switching
  authToggleBtn.addEventListener("click", () => {
    isSignupMode = !isSignupMode;
    if (isSignupMode) {
      authNameGroup.style.display = "flex";
      authSubmitBtn.textContent = "CADASTRAR";
      authToggleLabel.textContent = "Já tem uma conta?";
      authToggleBtn.textContent = "Entre aqui";
    } else {
      authNameGroup.style.display = "none";
      authSubmitBtn.textContent = "ENTRAR";
      authToggleLabel.textContent = "Não tem uma conta?";
      authToggleBtn.textContent = "Cadastre-se";
    }
  });

  // Submit credentials
  authSubmitBtn.addEventListener("click", handleAuthSubmit);

  // Tab switching
  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchTab(tab.dataset.target);
    });
  });

  document.getElementById("header-avatar-btn").addEventListener("click", () => {
    switchTab("view-perfil");
  });

  document.getElementById("see-groups-link").addEventListener("click", () => {
    rankingGroupSelect.value = "g1";
    renderLeaderboard("g1");
    switchTab("view-ranking");
  });

  document.getElementById("see-achievements-btn").addEventListener("click", () => {
    showToast("Você possui 2 de 12 conquistas gerais do torneio!", "info");
  });

  const filterTabs = document.querySelectorAll(".filter-tab");
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderMatchesList(tab.dataset.filter);
    });
  });

  document.getElementById("global-action-btn").addEventListener("click", () => {
    groupModal.classList.add("open");
  });

  document.getElementById("featured-palpitar-btn").addEventListener("click", () => {
    const featured = state.matches.find(m => m.status === "live") || state.matches[0];
    if (featured && featured.status !== "completed") {
      openPredictionModal(featured.id);
    } else {
      showToast("Partida finalizada.", "warning");
    }
  });

  // Modal event listeners
  document.getElementById("close-predict-modal").addEventListener("click", closeAllModals);
  document.getElementById("cancel-predict-btn").addEventListener("click", closeAllModals);
  document.getElementById("save-predict-btn").addEventListener("click", async () => {
    const h = modalHomeScore.value;
    const a = modalAwayScore.value;
    if (h === "" || a === "") {
      showToast("Preencha o placar do jogo.", "warning");
      return;
    }

    await syncSavePrediction(currentEditingMatchId, parseInt(h), parseInt(a));
    closeAllModals();
    showToast("Palpite registrado com sucesso!", "success");
    updateFeaturedMatchCard();
    renderMatchesList(document.querySelector(".filter-tab.active").dataset.filter);
  });

  document.getElementById("edit-profile-menu-btn").addEventListener("click", () => {
    document.getElementById("edit-name-input").value = state.user.name;
    profileModal.classList.add("open");
  });
  document.getElementById("close-profile-modal").addEventListener("click", closeAllModals);
  document.getElementById("cancel-profile-btn").addEventListener("click", closeAllModals);
  document.getElementById("save-profile-btn").addEventListener("click", () => {
    const name = document.getElementById("edit-name-input").value.trim();
    if (!name) {
      showToast("O nome não pode ser em branco.", "warning");
      return;
    }

    state.user.name = name;
    
    // Save to localStorage
    if (!isApiActive) {
      const usersDB = loadMockUsersDB();
      const uIdx = usersDB.findIndex(u => u.id === state.user.id);
      if (uIdx !== -1) {
        usersDB[uIdx].name = name;
        saveMockUsersDB(usersDB);
      }
    }

    saveState();
    closeAllModals();
    showToast("Perfil atualizado!", "success");
    updateProfileUI();
    renderLeaderboard(rankingGroupSelect.value);
  });

  document.getElementById("create-group-card-btn").addEventListener("click", () => {
    groupModal.classList.add("open");
  });
  document.getElementById("close-group-modal").addEventListener("click", closeAllModals);
  document.getElementById("cancel-group-btn").addEventListener("click", closeAllModals);
  document.getElementById("save-group-btn").addEventListener("click", async () => {
    const name = document.getElementById("group-name-input").value.trim();
    if (!name) {
      showToast("Digite o nome do grupo.", "warning");
      return;
    }

    const { groupId, inviteCode } = await syncCreateGroup(name);
    closeAllModals();
    showToast(`Grupo criado! Código: ${inviteCode}`, "success");
    
    renderGroups();
    
    const option = document.createElement("option");
    option.value = groupId;
    option.textContent = `Grupo: ${name}`;
    rankingGroupSelect.appendChild(option);
    document.getElementById("group-name-input").value = "";
  });

  rankingGroupSelect.addEventListener("change", (e) => {
    renderLeaderboard(e.target.value);
  });

  document.getElementById("toggle-notifications-btn").addEventListener("click", () => {
    state.user.notificationsEnabled = !state.user.notificationsEnabled;
    saveState();
    updateProfileUI();
    showToast(state.user.notificationsEnabled ? "Notificações ligadas." : "Notificações desligadas.", "info");
  });

  document.getElementById("notification-btn").addEventListener("click", () => {
    notificationBadge.style.display = "none";
    showToast("Você leu todas as notificações recentes.", "info");
  });

  // Footer / Support action items
  document.getElementById("security-settings-btn").addEventListener("click", () => {
    showToast("Sua conexão com o Cloudflare Workers está criptografada via HTTPS.", "info");
  });
  document.getElementById("rules-btn").addEventListener("click", () => {
    showToast("Regras: Placar Exato = 25 pts. Vencedor Correto = 10 pts. Erro = 0 pts.", "info");
  });
  document.getElementById("support-btn").addEventListener("click", () => {
    showToast("Suporte ativo: help@bolao2026.com", "info");
  });
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
}

// --- APP INITIALIZER ---
async function init() {
  await checkBackendConnectivity();
  loadState();
  initEventListeners();

  const token = localStorage.getItem("bolao_auth_token");
  if (token) {
    // Attempt auto-login
    try {
      if (isApiActive) {
        const uProfile = await apiRequest("/api/protected/me");
        state.user = uProfile;
      } else {
        const usersDB = loadMockUsersDB();
        const userId = token.replace("mock-token-", "");
        const found = usersDB.find(u => u.id === userId);
        if (!found) throw new Error("Mock token expired");
        state.user = found;
      }
      
      appShellContainer.classList.remove("auth-required");
      initAppContent();
    } catch (e) {
      console.warn("Session auto-login failed. Redirecting to login screen.", e);
      localStorage.removeItem("bolao_auth_token");
      appShellContainer.classList.add("auth-required");
    }
  } else {
    appShellContainer.classList.add("auth-required");
  }

  // Register PWA service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(e => console.log("SW failed", e));
  }

  // Simulator loop
  setInterval(simulateLiveMatchTick, 18000);
}

window.addEventListener("DOMContentLoaded", init);
