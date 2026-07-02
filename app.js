/* ==========================================================================
   BOLÃO COPA 2026 - APPLICATION LOGIC WITH ADMIN APPROVAL
   ========================================================================== */

// --- DUAL MODE CONFIGURATION ---
const API_BASE_URL = "https://bolao-api.renatodelta.workers.dev";
let isApiActive = false; // Toggled dynamically on initial connection check

const FIFA_TO_ISO = {
  "BRA": "br", "USA": "us", "NED": "nl", "MAR": "ma", "GER": "de",
  "PAR": "py", "FRA": "fr", "SWE": "se", "BEL": "be", "SEN": "sn",
  "ESP": "es", "AUT": "at", "POR": "pt", "CRO": "hr", "CIV": "ci",
  "NOR": "no", "MEX": "mx", "ECU": "ec", "ENG": "gb-eng", "COD": "cd",
  "SUI": "ch", "ALG": "dz", "COL": "co", "GHA": "gh", "AUS": "au",
  "EGY": "eg", "ARG": "ar", "CPV": "cv", "CAN": "ca", "RSA": "za",
  "JPN": "jp", "BIH": "ba"
};

// Helper to render flag images (FlagCDN) instead of unicode emojis
function getFlagHtml(abbrev, fallbackEmoji = "") {
  if (!abbrev || abbrev === "ADF") {
    return `<span class="flag-placeholder">🏳️</span>`;
  }
  // First try 3-letter FIFA code lookup
  const iso = FIFA_TO_ISO[abbrev.toUpperCase()];
  if (iso) {
    return `<img src="https://flagcdn.com/w40/${iso}.png" alt="${abbrev}" class="flag-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" /><span class="flag-emoji-fallback" style="display:none;">${fallbackEmoji}</span>`;
  }
  // Fallback: treat abbrev itself as an ISO 2-letter code (e.g. 'ec', 'ch', 'au')
  const raw = abbrev.toLowerCase();
  if (/^[a-z]{2}(-[a-z]+)?$/.test(raw)) {
    return `<img src="https://flagcdn.com/w40/${raw}.png" alt="${abbrev}" class="flag-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" /><span class="flag-emoji-fallback" style="display:none;">${fallbackEmoji}</span>`;
  }
  return `<span>${fallbackEmoji || abbrev}</span>`;
}

// Helper for custom confirmation modal instead of browser's ugly native alerts
function showConfirm(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-message").textContent = message;
    
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    
    const onAccept = () => {
      cleanup();
      resolve(true);
    };
    
    const cleanup = () => {
      modal.classList.remove("open");
      document.getElementById("confirm-cancel-btn").removeEventListener("click", onCancel);
      document.getElementById("confirm-accept-btn").removeEventListener("click", onAccept);
      document.getElementById("close-confirm-modal").removeEventListener("click", onCancel);
    };
    
    document.getElementById("confirm-cancel-btn").addEventListener("click", onCancel);
    document.getElementById("confirm-accept-btn").addEventListener("click", onAccept);
    document.getElementById("close-confirm-modal").addEventListener("click", onCancel);
    
    modal.classList.add("open");
  });
}

// Mock database inside LocalStorage for fallback testing
const DEFAULT_MOCK_USERS_DB = [
  {
    id: "admin_id",
    name: "Administrador",
    email: "admin@bolao.com",
    password: "admin123",
    points: 0,
    accuracy: 0,
    globalRank: 999,
    levelTitle: "Nível 100 — Organizador",
    status: "approved",
    is_admin: 1,
    notificationsEnabled: true
  },
  {
    id: "pedro_mock_id",
    name: "Pedro Alcântara",
    email: "pedro@bolao.com",
    password: "123456",
    points: 1240,
    accuracy: 68,
    globalRank: 6,
    levelTitle: "Nível 24 — Artilheiro",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_ana_id",
    name: "Ana Cláudia",
    email: "ana@bolao.com",
    password: "123456",
    points: 1520,
    accuracy: 68,
    globalRank: 2,
    levelTitle: "Nível 30 — Veterana",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_rodrigo_id",
    name: "Rodrigo",
    email: "rodrigo@bolao.com",
    password: "123456",
    points: 1580,
    accuracy: 72,
    globalRank: 1,
    levelTitle: "Nível 35 — Mestre",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_lucas_id",
    name: "Lucas Lima",
    email: "lucas@bolao.com",
    password: "123456",
    points: 0,
    accuracy: 0,
    globalRank: 999,
    levelTitle: "Nível 1 — Estreante",
    status: "pending",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_mariana_id",
    name: "Mariana Costa",
    email: "mariana@bolao.com",
    password: "123456",
    points: 1390,
    accuracy: 64,
    globalRank: 3,
    levelTitle: "Nível 27 — Ponta-de-Lança",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_carlos_id",
    name: "Carlos Silva",
    email: "carlos@bolao.com",
    password: "123456",
    points: 1100,
    accuracy: 60,
    globalRank: 7,
    levelTitle: "Nível 20 — Camisa 10",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_beatriz_id",
    name: "Beatriz Souza",
    email: "beatriz@bolao.com",
    password: "123456",
    points: 950,
    accuracy: 56,
    globalRank: 8,
    levelTitle: "Nível 15 — Volante",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_andre_id",
    name: "André Santos",
    email: "andre@bolao.com",
    password: "123456",
    points: 840,
    accuracy: 52,
    globalRank: 9,
    levelTitle: "Nível 12 — Zagueiro",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_fernanda_id",
    name: "Fernanda Alves",
    email: "fernanda@bolao.com",
    password: "123456",
    points: 0,
    accuracy: 0,
    globalRank: 999,
    levelTitle: "Nível 1 — Estreante",
    status: "pending",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_bruno_id",
    name: "Bruno Oliveira",
    email: "bruno@bolao.com",
    password: "123456",
    points: 720,
    accuracy: 48,
    globalRank: 10,
    levelTitle: "Nível 10 — Lateral",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_juliana_id",
    name: "Juliana Rocha",
    email: "juliana@bolao.com",
    password: "123456",
    points: 0,
    accuracy: 0,
    globalRank: 999,
    levelTitle: "Nível 1 — Estreante",
    status: "pending",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_gabriel_id",
    name: "Gabriel Cruz",
    email: "gabriel@bolao.com",
    password: "123456",
    points: 610,
    accuracy: 44,
    globalRank: 11,
    levelTitle: "Nível 8 — Goleiro",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_camila_id",
    name: "Camila Ribeiro",
    email: "camila@bolao.com",
    password: "123456",
    points: 530,
    accuracy: 40,
    globalRank: 12,
    levelTitle: "Nível 5 — Estreante",
    status: "approved",
    is_admin: 0,
    notificationsEnabled: true
  },
  {
    id: "user_thiago_id",
    name: "Thiago Lima",
    email: "thiago@bolao.com",
    password: "123456",
    points: 0,
    accuracy: 0,
    globalRank: 999,
    levelTitle: "Nível 1 — Estreante",
    status: "pending",
    is_admin: 0,
    notificationsEnabled: true
  }
];


// --- INITIAL STATE ---
const DEFAULT_STATE = {
  user: null,
  predictions: {},
  matches: [
    { id: "m1", homeTeam: "África do Sul", homeAbbrev: "RSA", homeFlag: "🇿🇦", awayTeam: "Canadá", awayAbbrev: "CAN", awayFlag: "🇨🇦", status: "completed", time: "28 JUN • Finalizado", homeScore: 0, awayScore: 1 },
    { id: "m2", homeTeam: "Países Baixos", homeAbbrev: "NED", homeFlag: "🇳🇱", awayTeam: "Marrocos", awayAbbrev: "MAR", awayFlag: "🇲🇦", status: "completed", time: "29 JUN • Finalizado", homeScore: 1, awayScore: 1 },
    { id: "m3", homeTeam: "Alemanha", homeAbbrev: "GER", homeFlag: "🇩🇪", awayTeam: "Paraguai", awayAbbrev: "PAR", awayFlag: "🇵🇾", status: "completed", time: "29 JUN • Finalizado", homeScore: 1, awayScore: 1 },
    { id: "m4", homeTeam: "França", homeAbbrev: "FRA", homeFlag: "🇫🇷", awayTeam: "Suécia", awayAbbrev: "SWE", awayFlag: "🇸🇪", status: "completed", time: "30 JUN • Finalizado", homeScore: 3, awayScore: 0 },
    { id: "m5", homeTeam: "Bélgica", homeAbbrev: "BEL", homeFlag: "🇧🇪", awayTeam: "Senegal", awayAbbrev: "SEN", awayFlag: "🇸🇳", status: "upcoming", time: "01 JUL • 17:00", homeScore: null, awayScore: null },
    { id: "m6", homeTeam: "Estados Unidos", homeAbbrev: "USA", homeFlag: "🇺🇸", awayTeam: "Bósnia e Herzegovina", awayAbbrev: "BIH", awayFlag: "🇧🇦", status: "upcoming", time: "01 JUL • 21:00", homeScore: null, awayScore: null },
    { id: "m7", homeTeam: "Espanha", homeAbbrev: "ESP", homeFlag: "🇪🇸", awayTeam: "Áustria", awayAbbrev: "AUT", awayFlag: "🇦🇹", status: "upcoming", time: "02 JUL • 16:00", homeScore: null, awayScore: null },
    { id: "m8", homeTeam: "Portugal", homeAbbrev: "POR", homeFlag: "🇵🇹", awayTeam: "Croácia", awayAbbrev: "CRO", awayFlag: "🇭🇷", status: "upcoming", time: "02 JUL • 20:00", homeScore: null, awayScore: null },
    { id: "m9", homeTeam: "Brasil", homeAbbrev: "BRA", homeFlag: "🇧🇷", awayTeam: "Japão", awayAbbrev: "JPN", awayFlag: "🇯🇵", status: "completed", time: "29 JUN • Finalizado", homeScore: 2, awayScore: 1 },
    { id: "m10", homeTeam: "Costa do Marfim", homeAbbrev: "CIV", homeFlag: "🇨🇮", awayTeam: "Noruega", awayAbbrev: "NOR", awayFlag: "🇳🇴", status: "completed", time: "30 JUN • Finalizado", homeScore: 1, awayScore: 2 },
    { id: "m11", homeTeam: "México", homeAbbrev: "MEX", homeFlag: "🇲🇽", awayTeam: "Equador", awayAbbrev: "ECU", awayFlag: "🇪🇨", status: "upcoming", time: "30 JUN • 23:00", homeScore: null, awayScore: null },
    { id: "m12", homeTeam: "Inglaterra", homeAbbrev: "ENG", homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", awayTeam: "RD Congo", awayAbbrev: "COD", awayFlag: "🇨🇩", status: "upcoming", time: "01 JUL • 13:00", homeScore: null, awayScore: null },
    { id: "m13", homeTeam: "Suíça", homeAbbrev: "SUI", homeFlag: "🇨🇭", awayTeam: "Argélia", awayAbbrev: "ALG", awayFlag: "🇩🇿", status: "upcoming", time: "03 JUL • 00:00", homeScore: null, awayScore: null },
    { id: "m14", homeTeam: "Colômbia", homeAbbrev: "COL", homeFlag: "🇨🇴", awayTeam: "Gana", awayAbbrev: "GHA", awayFlag: "🇬🇭", status: "upcoming", time: "03 JUL • 22:30", homeScore: null, awayScore: null },
    { id: "m15", homeTeam: "Austrália", homeAbbrev: "AUS", homeFlag: "🇦🇺", awayTeam: "Egito", awayAbbrev: "EGY", awayFlag: "🇪🇬", status: "upcoming", time: "03 JUL • 15:00", homeScore: null, awayScore: null },
    { id: "m16", homeTeam: "Argentina", homeAbbrev: "ARG", homeFlag: "🇦🇷", awayTeam: "Cabo Verde", awayAbbrev: "CPV", awayFlag: "🇨🇻", status: "upcoming", time: "03 JUL • 19:00", homeScore: null, awayScore: null },
    { id: "m17", homeTeam: "Canadá", homeAbbrev: "CAN", homeFlag: "🇨🇦", awayTeam: "Marrocos", awayAbbrev: "MAR", awayFlag: "🇲🇦", status: "upcoming", time: "04 JUL • 14:00", homeScore: null, awayScore: null },
    { id: "m18", homeTeam: "Paraguai", homeAbbrev: "PAR", homeFlag: "🇵🇾", awayTeam: "França", awayAbbrev: "FRA", awayFlag: "🇫🇷", status: "upcoming", time: "04 JUL • 18:00", homeScore: null, awayScore: null },
    { id: "m19", homeTeam: "Brasil", homeAbbrev: "BRA", homeFlag: "🇧🇷", awayTeam: "Noruega", awayAbbrev: "NOR", awayFlag: "🇳🇴", status: "upcoming", time: "05 JUL • 17:00", homeScore: null, awayScore: null },
    { id: "m20", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "05 JUL • 21:00", homeScore: null, awayScore: null },
    { id: "m21", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "06 JUL • 16:00", homeScore: null, awayScore: null },
    { id: "m22", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "06 JUL • 21:00", homeScore: null, awayScore: null },
    { id: "m23", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "07 JUL • 13:00", homeScore: null, awayScore: null },
    { id: "m24", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "07 JUL • 17:00", homeScore: null, awayScore: null },
    { id: "m25", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "09 JUL • 17:00", homeScore: null, awayScore: null },
    { id: "m26", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "10 JUL • 16:00", homeScore: null, awayScore: null },
    { id: "m27", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "11 JUL • 18:00", homeScore: null, awayScore: null },
    { id: "m28", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "11 JUL • 22:00", homeScore: null, awayScore: null },
    { id: "m29", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "14 JUL • 16:00", homeScore: null, awayScore: null },
    { id: "m30", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "15 JUL • 16:00", homeScore: null, awayScore: null },
    { id: "m31", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "18 JUL • 18:00", homeScore: null, awayScore: null },
    { id: "m32", homeTeam: "A definir", homeAbbrev: "ADF", homeFlag: "🏳️", awayTeam: "A definir", awayAbbrev: "ADF", awayFlag: "🏳️", status: "upcoming", time: "19 JUL • 16:00", homeScore: null, awayScore: null }
  ],
  rankings: {
    global: [
      { name: "Rodrigo", avatar: "avatar1.jpg", points: 1580, trend: "up", isCurrentUser: false },
      { name: "Ana Cláudia", avatar: "avatar2.jpg", points: 1520, trend: "same", isCurrentUser: false },
      { name: "Pedro Alcântara", avatar: "avatar.jpg", points: 1240, trend: "up", isCurrentUser: true }
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
        if (savedMatch) {
          if (defaultMatch.status === "completed") {
            return {
              ...savedMatch,
              homeTeam: defaultMatch.homeTeam,
              homeAbbrev: defaultMatch.homeAbbrev,
              homeFlag: defaultMatch.homeFlag,
              awayTeam: defaultMatch.awayTeam,
              awayAbbrev: defaultMatch.awayAbbrev,
              awayFlag: defaultMatch.awayFlag,
              status: "completed",
              homeScore: defaultMatch.homeScore,
              awayScore: defaultMatch.awayScore,
              time: defaultMatch.time,
              resultCalculated: true
            };
          }
          return {
            ...defaultMatch,
            status: savedMatch.status,
            homeScore: savedMatch.homeScore,
            awayScore: savedMatch.awayScore,
            realTimeMinute: savedMatch.realTimeMinute,
            resultCalculated: savedMatch.resultCalculated
          };
        }
        return defaultMatch;
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

// Status alerts & Banners
const pendingAlertBanner = document.getElementById("pending-alert-banner");
const profileAccountStatus = document.getElementById("profile-account-status");

// Tabs & Views
const viewPanels = document.querySelectorAll(".view-panel");
const navTabs = document.querySelectorAll(".nav-tab");
const welcomeName = document.getElementById("welcome-name");
const homeTotalPoints = document.getElementById("home-total-points");
const homeAccuracy = document.getElementById("home-accuracy");
const matchesListContainer = document.getElementById("matches-list-container");
const fullLeaderboardList = document.getElementById("full-leaderboard-list");
const homeRankingPreviewContainer = document.getElementById("home-ranking-preview-container");
const toastContainer = document.getElementById("toast-container");
const notificationBadge = document.getElementById("notification-badge");

// Profile fields
const profileDisplayName = document.getElementById("profile-display-name");
const profileLevelTitle = document.getElementById("profile-level-title");
const profilePoints = document.getElementById("profile-points");
const profileAccuracy = document.getElementById("profile-accuracy");
const profileGlobalRank = document.getElementById("profile-global-rank");

// Modals
const predictionModal = document.getElementById("prediction-modal");
const profileModal = document.getElementById("profile-modal");
const adminModal = document.getElementById("admin-modal");

// Predict modal fields
const modalHomeFlag = document.getElementById("modal-home-flag");
const modalHomeName = document.getElementById("modal-home-name");
const modalHomeScore = document.getElementById("modal-home-score");
const modalAwayFlag = document.getElementById("modal-away-flag");
const modalAwayName = document.getElementById("modal-away-name");
const modalAwayScore = document.getElementById("modal-away-score");

// Admin Panel user list container
const adminUsersListContainer = document.getElementById("admin-users-list-container");
const adminMatchesListContainer = document.getElementById("admin-matches-list-container");
const adminMatchModal = document.getElementById("admin-match-modal");

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
    const res = await fetch(`${API_BASE_URL}/api/matches`);
    if (!res.ok) throw new Error("API responded with error status");
    isApiActive = true;
    sandboxIndicator.style.display = "none";
    console.log("Cloudflare Workers API Active.");
  } catch (e) {
    isApiActive = false;
    sandboxIndicator.style.display = "block";
    console.log("Standalone Local Storage Mock Mode enabled.");
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

// --- STATE SYNCING ROUTINES ---
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

// --- AUTHENTICATION FLOW (LOGIN/SIGNUP) ---
async function handleAuthSubmit() {
  const email = authEmailInput.value.trim().toLowerCase();
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
      if (isSignupMode) {
        const data = await apiRequest("/api/auth/register", "POST", { name, email, password });
        localStorage.setItem("bolao_auth_token", data.token);
        state.user = data.user;
      } else {
        const data = await apiRequest("/api/auth/login", "POST", { email, password });
        localStorage.setItem("bolao_auth_token", data.token);
        state.user = data.user;
      }
    } else {
      const usersDB = loadMockUsersDB();

      if (isSignupMode) {
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
          globalRank: usersDB.length + 1,
          levelTitle: "Nível 1 — Estreante",
          status: "pending", // Always pending on registry
          is_admin: 0,
          notificationsEnabled: true
        };

        usersDB.push(newMockUser);
        saveMockUsersDB(usersDB);

        localStorage.setItem("bolao_auth_token", "mock-token-" + newMockId);
        state.user = newMockUser;
      } else {
        const found = usersDB.find(u => u.email === email && u.password === password);
        if (!found) {
          throw new Error("E-mail ou senha inválidos.");
        }

        localStorage.setItem("bolao_auth_token", "mock-token-" + found.id);
        state.user = found;
      }
    }

    saveState();
    appShellContainer.classList.remove("auth-required");
    showToast(`Bem-vindo, ${state.user.name}!`, "success");

    initAppContent();
  } catch (err) {
    showToast(err.message || "Erro na autenticação", "danger");
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignupMode ? "CADASTRAR" : "ENTRAR";
  }
}

async function handleLogout() {
  const confirmed = await showConfirm("Sair da Conta", "Deseja mesmo sair da sua conta?");
  if (confirmed) {
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

// --- ADMIN USERS RETRIEVAL & RENDER ---
async function loadAdminUsers() {
  adminUsersListContainer.innerHTML = "";

  try {
    let usersList = [];
    if (isApiActive) {
      usersList = await apiRequest("/api/protected/admin/users");
    } else {
      // Mock mode LocalStorage retrieval
      usersList = loadMockUsersDB();
    }

    if (usersList.length === 0) {
      adminUsersListContainer.innerHTML = "<p style='color: var(--color-secondary); text-align: center; padding: 20px;'>Nenhum usuário cadastrado.</p>";
      return;
    }

    usersList.forEach(u => {
      // Don't show admin toggle for oneself
      if (u.id === state.user.id) return;

      const card = document.createElement("div");
      card.className = "admin-user-card";

      const badgeClass = u.status === "approved" ? "approved" : "pending";
      const badgeText = u.status === "approved" ? "Liberado" : "Pendente";

      let actionBtnHtml = "";
      if (u.is_admin === 1) {
        actionBtnHtml = "<span style='font-size: 11px; color: var(--color-secondary); font-weight: 700;'>ADMIN</span>";
      } else if (u.status === "approved") {
        actionBtnHtml = `<button class="btn-status-toggle suspend-action" data-user-id="${u.id}" data-action="pending">Suspender</button>`;
      } else {
        actionBtnHtml = `<button class="btn-status-toggle approve-action" data-user-id="${u.id}" data-action="approved">Liberar Acesso</button>`;
      }

      card.innerHTML = `
        <div class="admin-user-info">
          <span class="name">${u.name}</span>
          <span class="email">${u.email}</span>
          <span class="points">${u.points} Pontos</span>
        </div>
        <div class="admin-user-actions">
          <span class="status-badge ${badgeClass}">${badgeText}</span>
          ${actionBtnHtml}
        </div>
      `;

      // Bind toggle status event click
      const actionBtn = card.querySelector(".btn-status-toggle");
      if (actionBtn) {
        actionBtn.addEventListener("click", async () => {
          const targetUserId = actionBtn.dataset.userId;
          const nextStatus = actionBtn.dataset.action;

          await toggleUserStatus(targetUserId, nextStatus);
        });
      }

      adminUsersListContainer.appendChild(card);
    });
  } catch (err) {
    showToast("Erro ao carregar usuários admin: " + err.message, "danger");
  }
}

async function toggleUserStatus(targetUserId, nextStatus) {
  try {
    if (isApiActive) {
      await apiRequest("/api/protected/admin/users/toggle-status", "POST", { targetUserId, status: nextStatus });
    } else {
      // Mock Mode toggle
      const db = loadMockUsersDB();
      const userIdx = db.findIndex(u => u.id === targetUserId);
      if (userIdx !== -1) {
        db[userIdx].status = nextStatus;
        saveMockUsersDB(db);

        // Also update local rankings if necessary
        const globalRankItem = state.rankings.global.find(item => item.name === db[userIdx].name);
        if (globalRankItem) {
          // If suspended, we could hide them, but let's keep them in memory
        }
      }
    }

    showToast("Status do usuário atualizado com sucesso!", "success");
    loadAdminUsers();

    // Refresh global ranking list in case an approval affects points displays
    renderLeaderboard("global");
  } catch (err) {
    showToast("Erro ao alterar status: " + err.message, "danger");
  }
}

// --- ADMIN MATCHES RETRIEVAL & RENDER ---
// --- ADMIN MATCHES RETRIEVAL & RENDER ---
async function loadAdminMatches() {
  adminMatchesListContainer.innerHTML = "";

  state.matches.forEach(m => {
    if (["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"].includes(m.id)) return;
    const card = document.createElement("div");
    card.className = "admin-user-card admin-match-inline-card";
    card.style.flexDirection = "column";
    card.style.alignItems = "stretch";
    card.style.padding = "16px";
    card.style.gap = "12px";

    card.innerHTML = `
      <div class="admin-album-match" style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
        <div class="admin-album-teams" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div class="admin-album-team home" style="display: flex; align-items: center; gap: 8px; width: 38%; min-width: 0;">
            <div class="match-team-flag" style="font-size: 24px;">${getFlagHtml(m.homeAbbrev, m.homeFlag)}</div>
            <span style="font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${m.homeTeam}">${m.homeTeam}</span>
          </div>
          
          <div class="admin-album-inputs" style="display: flex; align-items: center; gap: 6px; justify-content: center; width: 24%;">
            <input type="number" min="0" max="99" class="score-input admin-inline-score home-score-input" value="${m.homeScore !== null ? m.homeScore : ''}" placeholder="-" style="width: 42px; height: 38px; font-size: 18px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-input); color: white; text-align: center; font-weight: 800;">
            <span style="font-weight: 900; color: var(--color-secondary); font-size: 14px;">x</span>
            <input type="number" min="0" max="99" class="score-input admin-inline-score away-score-input" value="${m.awayScore !== null ? m.awayScore : ''}" placeholder="-" style="width: 42px; height: 38px; font-size: 18px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-input); color: white; text-align: center; font-weight: 800;">
          </div>
          
          <div class="admin-album-team away" style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; width: 38%; min-width: 0; text-align: right;">
            <span style="font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${m.awayTeam}">${m.awayTeam}</span>
            <div class="match-team-flag" style="font-size: 24px;">${getFlagHtml(m.awayAbbrev, m.awayFlag)}</div>
          </div>
        </div>
        
        <div class="admin-album-meta" style="display: flex; align-items: center; justify-content: space-between; width: 100%; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
            <select class="premium-select admin-inline-status" style="width: 105px; padding: 4px 18px 4px 6px; font-size: 11px; margin-bottom: 0; height: 28px; border-radius: 6px; background-size: 10px;">
              <option value="upcoming" ${m.status === 'upcoming' ? 'selected' : ''}>Agendado</option>
              <option value="live" ${m.status === 'live' ? 'selected' : ''}>Ao Vivo</option>
              <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Finalizado</option>
            </select>
            <span style="font-size: 11px; color: var(--color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${m.time}">${m.time}</span>
          </div>
          
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button class="btn btn-primary btn-gold save-inline-match-btn" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; font-weight: 700; height: 28px; min-height: auto;">Salvar</button>
            <button class="btn-status-toggle delete-match-action" style="padding: 4px 10px; font-size: 11px; background-color: var(--color-danger); color: white; border: none; border-radius: 6px; height: 28px; font-weight: 700;">Excluir</button>
          </div>
        </div>
      </div>
    `;

    // Bind save inline event
    card.querySelector(".save-inline-match-btn").addEventListener("click", async () => {
      const homeScoreVal = card.querySelector(".home-score-input").value;
      const awayScoreVal = card.querySelector(".away-score-input").value;
      const statusVal = card.querySelector(".admin-inline-status").value;

      const homeScore = homeScoreVal !== "" ? parseInt(homeScoreVal) : null;
      const awayScore = awayScoreVal !== "" ? parseInt(awayScoreVal) : null;

      await saveAdminMatchInline(m.id, homeScore, awayScore, statusVal);
    });

    // Bind delete event
    card.querySelector(".delete-match-action").addEventListener("click", () => {
      deleteAdminMatch(m.id);
    });

    adminMatchesListContainer.appendChild(card);
  });
}

async function saveAdminMatchInline(matchId, homeScore, awayScore, status) {
  const m = state.matches.find(item => item.id === matchId);
  if (!m) return;

  if (status === "completed" && (homeScore === null || awayScore === null)) {
    showToast("A partida só pode ser finalizada se houver placar cadastrado.", "warning");
    return;
  }

  try {
    if (isApiActive) {
      await apiRequest("/api/protected/admin/matches/update", "POST", {
        matchId: matchId,
        homeTeam: m.homeTeam,
        homeAbbrev: m.homeAbbrev,
        homeFlag: m.homeFlag,
        awayTeam: m.awayTeam,
        awayAbbrev: m.awayAbbrev,
        awayFlag: m.awayFlag,
        homeScore: homeScore,
        awayScore: awayScore,
        status: status,
        time: m.time,
        startTime: m.startTime
      });
    } else {
      const mIdx = state.matches.findIndex(item => item.id === matchId);
      if (mIdx !== -1) {
        state.matches[mIdx].homeScore = homeScore;
        state.matches[mIdx].awayScore = awayScore;
        state.matches[mIdx].status = status;
      }

      if (status === "completed") {
        const usersDB = loadMockUsersDB();

        usersDB.forEach(u => {
          let points = 0;
          let correct = 0;
          let predictedCount = 0;

          state.matches.forEach(match => {
            if (match.status === "completed") {
              const pred = state.predictions[match.id];
              if (pred) {
                predictedCount++;
                const gained = getPointsAwarded(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore);
                points += gained;
                if (gained > 0) correct++;
              }
            }
          });

          u.points = points;
          u.accuracy = predictedCount > 0 ? Math.round((correct / predictedCount) * 100) : 0;
        });

        saveMockUsersDB(usersDB);

        const me = usersDB.find(u => u.id === state.user.id);
        if (me) {
          state.user.points = me.points;
          state.user.accuracy = me.accuracy;
        }
      }

      saveState();
    }

    showToast("Partida atualizada com sucesso!", "success");
    initAppContent(); // Refresh UI in the background
  } catch (err) {
    showToast("Erro ao salvar partida: " + err.message, "danger");
  }
}

let currentEditingAdminMatchId = null;

function openAdminMatchModal(matchId) {
  const m = state.matches.find(item => item.id === matchId);
  if (!m) return;

  currentEditingAdminMatchId = matchId;

  const homeSelect = document.getElementById("admin-home-select");
  const awaySelect = document.getElementById("admin-away-select");

  setSelectedValue(homeSelect, m.homeTeam, m.homeAbbrev, m.homeFlag);
  setSelectedValue(awaySelect, m.awayTeam, m.awayAbbrev, m.awayFlag);

  document.getElementById("admin-home-score").value = m.homeScore !== null ? m.homeScore : "";
  document.getElementById("admin-away-score").value = m.awayScore !== null ? m.awayScore : "";

  document.getElementById("admin-status-select").value = m.status;

  // Load Date/Time Fields
  document.getElementById("admin-time-input").value = m.time || "";
  let rawStartTime = m.startTime || "";
  if (rawStartTime) {
    rawStartTime = rawStartTime.replace(" ", "T").substring(0, 16);
  }
  document.getElementById("admin-start-time-input").value = rawStartTime;

  adminMatchModal.classList.add("open");
}

function setSelectedValue(selectEl, name, abbrev, flag) {
  for (let option of selectEl.options) {
    const parts = option.value.split('|');
    if (parts[0].toLowerCase() === name.toLowerCase() || option.text.toLowerCase() === name.toLowerCase()) {
      selectEl.value = option.value;
      return;
    }
  }
  selectEl.selectedIndex = 0;
}

async function saveAdminMatchDetails() {
  const homeVal = document.getElementById("admin-home-select").value;
  const awayVal = document.getElementById("admin-away-select").value;

  const [homeNameSlug, homeAbbrev, homeFlag] = homeVal.split('|');
  const [awayNameSlug, awayAbbrev, awayFlag] = awayVal.split('|');

  const homeTeam = document.querySelector(`#admin-home-select option[value="${homeVal}"]`).text;
  const awayTeam = document.querySelector(`#admin-away-select option[value="${awayVal}"]`).text;

  const homeScoreRaw = document.getElementById("admin-home-score").value;
  const awayScoreRaw = document.getElementById("admin-away-score").value;

  const homeScore = homeScoreRaw !== "" ? parseInt(homeScoreRaw) : null;
  const awayScore = awayScoreRaw !== "" ? parseInt(awayScoreRaw) : null;

  const status = document.getElementById("admin-status-select").value;
  const time = document.getElementById("admin-time-input").value;
  const startTimeVal = document.getElementById("admin-start-time-input").value;

  if (status === "completed" && (homeScore === null || awayScore === null)) {
    showToast("A partida só pode ser finalizada se houver placar cadastrado.", "warning");
    return;
  }

  // Format startTime (YYYY-MM-DDTHH:MM -> YYYY-MM-DD HH:MM:00)
  let startTime = startTimeVal;
  if (startTimeVal && startTimeVal.includes("T")) {
    startTime = startTimeVal.replace("T", " ") + ":00";
  }

  try {
    if (isApiActive) {
      await apiRequest("/api/protected/admin/matches/update", "POST", {
        matchId: currentEditingAdminMatchId,
        homeTeam: homeTeam || null,
        homeAbbrev: homeAbbrev || null,
        homeFlag: homeFlag || null,
        awayTeam: awayTeam || null,
        awayAbbrev: awayAbbrev || null,
        awayFlag: awayFlag || null,
        homeScore: homeScore !== undefined ? homeScore : null,
        awayScore: awayScore !== undefined ? awayScore : null,
        status: status || null,
        time: time || null,
        startTime: startTime || null
      });
    } else {
      const mIdx = state.matches.findIndex(m => m.id === currentEditingAdminMatchId);
      if (mIdx !== -1) {
        state.matches[mIdx].homeTeam = homeTeam;
        state.matches[mIdx].homeAbbrev = homeAbbrev;
        state.matches[mIdx].homeFlag = homeFlag;
        state.matches[mIdx].awayTeam = awayTeam;
        state.matches[mIdx].awayAbbrev = awayAbbrev;
        state.matches[mIdx].awayFlag = awayFlag;
        state.matches[mIdx].homeScore = homeScore;
        state.matches[mIdx].awayScore = awayScore;
        state.matches[mIdx].status = status;
        state.matches[mIdx].time = time;
        state.matches[mIdx].startTime = startTime;
      }

      if (status === "completed") {
        const usersDB = loadMockUsersDB();

        usersDB.forEach(u => {
          let points = 0;
          let correct = 0;
          let predictedCount = 0;

          state.matches.forEach(match => {
            if (match.status === "completed") {
              const pred = state.predictions[match.id];
              if (pred) {
                predictedCount++;
                const gained = getPointsAwarded(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore);
                points += gained;
                if (gained > 0) correct++;
              }
            }
          });

          u.points = points;
          u.accuracy = predictedCount > 0 ? Math.round((correct / predictedCount) * 100) : 0;
        });

        saveMockUsersDB(usersDB);

        const me = usersDB.find(u => u.id === state.user.id);
        if (me) {
          state.user.points = me.points;
          state.user.accuracy = me.accuracy;
        }
      }

      saveState();
    }

    closeAllModals();
    adminMatchModal.classList.remove("open");
    showToast("Partida atualizada com sucesso!", "success");
    initAppContent(); // Refresh UI in the background
  } catch (err) {
    showToast("Erro ao salvar partida: " + err.message, "danger");
  }
}

async function deleteAdminMatch(matchId) {
  const confirmed = await showConfirm(
    "Excluir Partida",
    "Tem certeza que deseja excluir esta partida? Todos os palpites relacionados a ela também serão excluídos."
  );
  if (!confirmed) {
    return;
  }

  try {
    if (isApiActive) {
      await apiRequest(`/api/protected/admin/matches/${matchId}`, "DELETE");
    } else {
      state.matches = state.matches.filter(m => m.id !== matchId);
      delete state.predictions[matchId];
      saveState();
    }

    showToast("Partida excluída com sucesso!", "success");
    initAppContent(); // Refresh UI in the background
  } catch (err) {
    showToast("Erro ao excluir partida: " + err.message, "danger");
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
        startTime: m.start_time,
        homeScore: m.home_score,
        awayScore: m.away_score,
        realTimeMinute: m.id === "m1" ? 62 : null,
        resultCalculated: m.id === "m1" ? (m.home_score >= 2) : false
      }));
    } catch (e) {
      console.warn("Could not load matches from API, using cached/local matches", e);
    }

    // Load user predictions from server and restore into local state
    try {
      const preds = await apiRequest("/api/protected/predictions");
      if (Array.isArray(preds)) {
        preds.forEach(p => {
          state.predictions[p.match_id] = { homeScore: p.home_score, awayScore: p.away_score };
        });
      }
    } catch (e) {
      console.warn("Could not load predictions from API", e);
    }
  }
}

// --- RENDER APP SCREEN AFTER LOGGED IN ---
async function initAppContent() {
  await loadMatchesData();
  updateProfileUI();
  renderLeaderboard("global");
  renderHomeRankingPreview();
  updateFeaturedMatchCard();
  renderMatchesList("all");

  // Show/Hide Admin Settings Shortcut Button based on privileges
  const adminBtn = document.getElementById("admin-panel-menu-btn");
  if (state.user?.is_admin === 1) {
    adminBtn.style.display = "flex";
  } else {
    adminBtn.style.display = "none";
  }

  // Set initial header avatar
  document.getElementById("header-avatar-img").src = `public/${state.user?.avatar || 'avatar.jpg'}`;
  document.getElementById("profile-avatar-large").src = `public/${state.user?.avatar || 'avatar.jpg'}`;
}

// --- UI UPDATES FOR USER APPROVAL BANNER ---
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

  // Control account status banner & text values
  if (u.status === "pending") {
    pendingAlertBanner.style.display = "block";
    profileAccountStatus.textContent = "Pendente";
    profileAccountStatus.style.color = "#f59e0b";
  } else {
    pendingAlertBanner.style.display = "none";
    profileAccountStatus.textContent = "Ativo";
    profileAccountStatus.style.color = "var(--color-success)";
  }

  const notifStateLabel = document.getElementById("notif-state-label");
  if (notifStateLabel) {
    notifStateLabel.textContent = u.notificationsEnabled ? "Ligado" : "Desligado";
  }
}

// --- SCORE AND CHART FUNCTIONS ---
let rankingChartInstance = null;

function getPointsAwarded(predHome, predAway, realHome, realAway) {
  if (predHome === null || predAway === null || realHome === null || realAway === null) return 0;
  
  // 1. Placar exato
  if (predHome === realHome && predAway === realAway) {
    return 10;
  }
  
  const predResult = Math.sign(predHome - predAway);
  const realResult = Math.sign(realHome - realAway);
  const predDiff = predHome - predAway;
  const realDiff = realHome - realAway;
  
  // 2. Acertar vencedor/empate + saldo de gols
  if (predResult === realResult && predDiff === realDiff) {
    return 7;
  }
  
  // 3. Acertar apenas o vencedor/empate
  if (predResult === realResult) {
    return 5;
  }
  
  // 4. Acertar quantidade de gols de pelo menos um dos times
  if (predHome === realHome || predAway === realAway) {
    return 2;
  }
  
  return 0;
}

function renderRankingChart() {
  const ctx = document.getElementById("ranking-history-chart");
  if (!ctx) return;

  let users = [];
  if (!isApiActive) {
    users = loadMockUsersDB();
  } else {
    users = (state.rankings.global || []).map(r => ({
      id: r.name,
      name: r.name,
      points: r.points,
      isCurrentUser: r.isCurrentUser
    }));
  }

  const baseHistories = {
    "admin_id": [0, 0, 0, 0, 0, 0],
    "user_rodrigo_id": [0, 500, 800, 1100, 1580, 1580],
    "user_ana_id": [0, 600, 900, 1200, 1520, 1520],
    "user_mariana_id": [0, 300, 600, 1000, 1390, 1390],
    "pedro_mock_id": [0, 400, 700, 950, 1240, 1240],
    "user_carlos_id": [0, 450, 650, 850, 1100, 1100],
    "user_beatriz_id": [0, 350, 550, 750, 950, 950],
    "user_andre_id": [0, 300, 500, 700, 840, 840],
    "user_bruno_id": [0, 250, 400, 550, 720, 720],
    "user_gabriel_id": [0, 200, 350, 480, 610, 610],
    "user_camila_id": [0, 150, 280, 400, 530, 530]
  };

  const m1 = state.matches.find(m => m.id === "m1");
  const isM1Played = m1 && (m1.status === "completed" || m1.status === "live");
  const m1RealHome = m1 ? m1.homeScore : null;
  const m1RealAway = m1 ? m1.awayScore : null;

  const m1MockPredictions = {
    "user_rodrigo_id": { home: 3, away: 0 },
    "user_ana_id": { home: 2, away: 1 },
    "user_mariana_id": { home: 1, away: 1 },
    "user_carlos_id": { home: 2, away: 0 },
    "user_beatriz_id": { home: 0, away: 1 },
    "user_andre_id": { home: 2, away: 2 },
    "user_bruno_id": { home: 4, away: 1 },
    "user_gabriel_id": { home: 1, away: 2 },
    "user_camila_id": { home: 3, away: 1 }
  };

  users.forEach(u => {
    let hist = baseHistories[u.id];
    if (!hist) {
      hist = [0, 0, 0, 0, u.points, u.points];
      baseHistories[u.id] = hist;
    }

    if (u.id === "pedro_mock_id" || u.isCurrentUser || u.id === state.user?.id) {
      hist[4] = state.user?.points || 0;
    } else {
      hist[4] = u.points;
    }

    if (isM1Played && m1RealHome !== null && m1RealAway !== null) {
      let predHome = null;
      let predAway = null;

      if (u.id === "pedro_mock_id" || u.isCurrentUser || u.id === state.user?.id) {
        const pred = state.predictions["m1"];
        if (pred) {
          predHome = pred.homeScore;
          predAway = pred.awayScore;
        }
      } else {
        const pred = m1MockPredictions[u.id];
        if (pred) {
          predHome = pred.home;
          predAway = pred.away;
        }
      }

      const m1Gained = getPointsAwarded(predHome, predAway, m1RealHome, m1RealAway);
      hist[5] = hist[4] + m1Gained;
    } else {
      hist[5] = hist[4];
    }
  });

  const rankHistories = {};
  users.forEach(u => {
    rankHistories[u.id] = [];
  });

  const stepsCount = 6;
  for (let step = 0; step < stepsCount; step++) {
    const sortedAtStep = [...users].map(u => ({
      id: u.id,
      points: baseHistories[u.id] ? baseHistories[u.id][step] : 0
    }));
    sortedAtStep.sort((a, b) => b.points - a.points);

    sortedAtStep.forEach((item, index) => {
      if (rankHistories[item.id]) {
        rankHistories[item.id].push(index + 1);
      }
    });
  }

  const sortedCurrent = [...users].sort((a, b) => (baseHistories[b.id][5]) - (baseHistories[a.id][5]));
  const top4Ids = sortedCurrent.slice(0, 4).map(u => u.id);
  const currentUserId = state.user?.id || "pedro_mock_id";

  const idsToShow = new Set(top4Ids);
  idsToShow.add(currentUserId);

  const colors = [
    "#3b82f6", "#10b981", "#ec4899", "#a855f7", "#06b6d4",
    "#f59e0b", "#ef4444", "#14b8a6", "#6366f1", "#f43f5e",
    "#84cc16", "#10b981"
  ];
  const datasets = [];
  let colorIdx = 0;

  users.forEach(u => {
    const isMe = u.id === currentUserId;
    const label = isMe ? `${u.name} (Você)` : u.name;
    datasets.push({
      label: label,
      data: rankHistories[u.id],
      borderColor: isMe ? "#ffd000" : colors[colorIdx % colors.length],
      backgroundColor: "transparent",
      borderWidth: isMe ? 4 : 2,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    });
    if (!isMe) colorIdx++;
  });

  if (rankingChartInstance) {
    rankingChartInstance.destroy();
  }

  const labels = ["Início", "Jogo 1", "Jogo 2", "Jogo 3", "Jogo 4", "Jogo 5"];

  rankingChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", font: { family: "Outfit", size: 10 } }
        },
        y: {
          reverse: true,
          min: 1,
          max: Math.max(10, users.length),
          ticks: {
            stepSize: 1,
            color: "#94a3b8",
            font: { family: "Outfit", size: 10 },
            callback: function (value) { return value + "º"; }
          },
          grid: { color: "rgba(255, 255, 255, 0.05)" }
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            color: "#94a3b8",
            font: { family: "Outfit", size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + ": " + context.raw + "º Lugar";
            }
          }
        }
      }
    }
  });
}

function renderLeaderboard(groupId = "global") {
  // Mock fallback logic loads global database to calculate rankings dynamically in mock mode!
  let rankingList = [];
  if (!isApiActive) {
    const db = loadMockUsersDB();
    rankingList = db
      .map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar || "avatar.jpg",
        points: user.points,
        trend: user.id === "pedro_mock_id" ? "up" : "same",
        isCurrentUser: user.id === state.user.id
      }));
  } else {
    rankingList = [...(state.rankings.global || [])];
    const userRankItem = rankingList.find(item => item.isCurrentUser);
    if (userRankItem && state.user) {
      userRankItem.points = state.user.points;
      userRankItem.name = state.user.name;
    }
  }

  rankingList.sort((a, b) => b.points - a.points);

  // Update currentUser globalRank in state and local storage DB if mock mode
  const currentLeaderboardIndex = rankingList.findIndex(item => item.isCurrentUser);
  if (currentLeaderboardIndex !== -1 && state.user) {
    const newRank = currentLeaderboardIndex + 1;
    state.user.globalRank = newRank;
    saveState();

    if (!isApiActive) {
      const db = loadMockUsersDB();
      const uIdx = db.findIndex(u => u.id === state.user.id);
      if (uIdx !== -1) {
        db[uIdx].globalRank = newRank;
        db[uIdx].points = state.user.points;
        saveMockUsersDB(db);
      }
    }
  }

  fullLeaderboardList.innerHTML = "";

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

  renderRankingChart();
}

function renderHomeRankingPreview() {
  let rankingList = [];
  if (!isApiActive) {
    const db = loadMockUsersDB();
    rankingList = db
      .map(user => ({
        name: user.name,
        avatar: user.avatar || "avatar.jpg",
        points: user.points,
        trend: user.id === "pedro_mock_id" ? "up" : "same"
      }));
  } else {
    rankingList = [...(state.rankings.global || [])];
  }

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
      switchTab("view-ranking");
    });

    homeRankingPreviewContainer.appendChild(card);
  });
}

function renderMatchesList(filter = "all") {
  matchesListContainer.innerHTML = "";

  const filteredMatches = state.matches.filter(m => {
    if (["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"].includes(m.id)) {
      return false;
    }
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

    const userPred = state.predictions[m.id];
    
    // Add border status classes
    if (m.status === "completed") {
      card.classList.add("completed-match");
    } else if (userPred) {
      card.classList.add("has-prediction");
    } else {
      card.classList.add("no-prediction");
    }

    const homeScoreDisplay = m.homeScore !== null ? m.homeScore : "-";
    const awayScoreDisplay = m.awayScore !== null ? m.awayScore : "-";

    const predHomeScore = userPred ? userPred.homeScore : "";
    const predAwayScore = userPred ? userPred.awayScore : "";

    // Badge status
    let statusBadgeHtml = "";
    if (m.status === "completed") {
      const gainedPoints = userPred ? getPointsAwarded(userPred.homeScore, userPred.awayScore, m.homeScore, m.awayScore) : 0;
      statusBadgeHtml = `<span class="badge-status badge-completed">+${gainedPoints} PTS</span>`;
    } else if (userPred) {
      statusBadgeHtml = `<span class="badge-status badge-saved">Palpite salvo</span>`;
    } else {
      statusBadgeHtml = `<span class="badge-status badge-open">Aberto</span>`;
    }

    // Prediction score displays or inputs
    let middleScoresHtml = "";
    if (m.status === "completed") {
      middleScoresHtml = `
        <div class="match-score-boxes">
          <span class="score-box completed">${homeScoreDisplay}</span>
          <span class="score-vs">x</span>
          <span class="score-box completed">${awayScoreDisplay}</span>
        </div>
      `;
    } else {
      // For active/upcoming games, we can show the user's prediction directly inside input-like boxes!
      middleScoresHtml = `
        <div class="match-score-boxes">
          <span class="score-box prediction">${predHomeScore !== "" ? predHomeScore : "-"}</span>
          <span class="score-vs">x</span>
          <span class="score-box prediction">${predAwayScore !== "" ? predAwayScore : "-"}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="match-row-container" style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 8px;">
        <div class="match-team home" style="display: flex; align-items: center; gap: 8px; width: 38%; min-width: 0;">
          <span class="match-team-flag" style="font-size: 24px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${getFlagHtml(m.homeAbbrev, m.homeFlag)}</span>
          <span class="match-team-name" style="font-size: 14px; font-weight: 700; color: var(--color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.homeTeam}</span>
        </div>
        
        ${middleScoresHtml}
        
        <div class="match-team away" style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; width: 38%; min-width: 0; text-align: right;">
          <span class="match-team-name" style="font-size: 14px; font-weight: 700; color: var(--color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.awayTeam}</span>
          <span class="match-team-flag" style="font-size: 24px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${getFlagHtml(m.awayAbbrev, m.awayFlag)}</span>
        </div>
      </div>
      
      <div class="match-footer-container" style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid rgba(0,0,0,0.03); padding-top: 6px; margin-top: 2px;">
        <span class="match-time-text" style="font-size: 11px; color: var(--color-secondary); font-weight: 500;">${m.time}</span>
        ${statusBadgeHtml}
      </div>
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
  const visibleMatches = state.matches.filter(m => !["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"].includes(m.id));
  const featured = visibleMatches.find(m => m.status === "live") || visibleMatches.find(m => m.status === "upcoming") || visibleMatches[0];
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

  document.getElementById("featured-home-flag").innerHTML = getFlagHtml(featured.homeAbbrev, featured.homeFlag);
  document.getElementById("featured-home-abbrev").textContent = featured.homeAbbrev;
  document.getElementById("featured-away-flag").innerHTML = getFlagHtml(featured.awayAbbrev, featured.awayFlag);
  document.getElementById("featured-away-abbrev").textContent = featured.awayAbbrev;

  const formattedTime = featured.status === "live"
    ? `Placar Atual: ${featured.homeScore} x ${featured.awayScore}`
    : featured.time;

  document.getElementById("featured-match-time").textContent = formattedTime;

  const featuredBtn = document.getElementById("featured-palpitar-btn");
  if (featured.status === "completed") {
    featuredBtn.innerHTML = `VER DETALHES <span class="arrow">→</span>`;
  } else {
    if (state.user?.status === "pending") {
      featuredBtn.innerHTML = `BLOQUEADO (PENDENTE) <span class="arrow">🔒</span>`;
    } else {
      const userPred = state.predictions[featured.id];
      if (userPred) {
        featuredBtn.innerHTML = `PALPITE: ${userPred.homeScore} x ${userPred.awayScore} (Editar) <span class="arrow">→</span>`;
      } else {
        featuredBtn.innerHTML = `PALPITAR AGORA <span class="arrow">→</span>`;
      }
    }
  }
}

// --- MODALS OPEN CONTROL WITH PENDING BLOCKS ---
function openPredictionModal(matchId) {
  if (state.user?.status === "pending") {
    showToast("⚠️ Sua conta está pendente de liberação. Confirme o pagamento para liberar os palpites.", "warning");
    return;
  }

  const m = state.matches.find(item => item.id === matchId);
  if (!m) return;

  currentEditingMatchId = matchId;
  modalHomeFlag.innerHTML = getFlagHtml(m.homeAbbrev, m.homeFlag);
  modalHomeName.textContent = m.homeTeam;
  modalAwayFlag.innerHTML = getFlagHtml(m.awayAbbrev, m.awayFlag);
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
  adminModal.classList.remove("open");
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

    // Add points only if approved and predicted
    if (state.user?.status === "approved") {
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
    }

    saveState();
    updateProfileUI();
    renderLeaderboard("global");
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

// --- TAB NAVIGATION SYSTEM ---
function switchTab(tabId) {
  // Hide all panels
  viewPanels.forEach(panel => {
    panel.classList.remove("active");
  });

  // Show target panel
  const targetPanel = document.getElementById(tabId);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // Update nav tabs active styling
  navTabs.forEach(tab => {
    if (tab.dataset.target === tabId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Dynamically refresh tab content if needed
  if (tabId === "view-palpites") {
    const activeFilter = document.querySelector(".filter-tab.active")?.dataset.filter || "all";
    renderMatchesList(activeFilter);
  } else if (tabId === "view-ranking") {
    renderLeaderboard("global");
    renderRankingChart();
  } else if (tabId === "view-perfil") {
    updateProfileUI();
  }
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

  authSubmitBtn.addEventListener("click", handleAuthSubmit);

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchTab(tab.dataset.target);
    });
  });

  document.getElementById("header-avatar-btn").addEventListener("click", () => {
    switchTab("view-perfil");
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

  // Action button: floating button disabled or redirects to support
  document.getElementById("global-action-btn").style.display = "none"; // Hide FAB since groups are removed

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
    renderLeaderboard("global");
  });

  // Admin Modal trigger click
  document.getElementById("admin-panel-menu-btn").addEventListener("click", () => {
    // Reset to Users Tab by default
    document.getElementById("admin-tab-users").classList.add("active");
    document.getElementById("admin-tab-matches").classList.remove("active");
    document.getElementById("admin-users-tab-content").style.display = "block";
    document.getElementById("admin-matches-tab-content").style.display = "none";

    loadAdminUsers();
    adminModal.classList.add("open");
  });

  document.getElementById("close-admin-modal").addEventListener("click", closeAllModals);

  // Admin Modal Tab Switchers
  document.getElementById("admin-tab-users").addEventListener("click", () => {
    document.getElementById("admin-tab-users").classList.add("active");
    document.getElementById("admin-tab-matches").classList.remove("active");
    document.getElementById("admin-users-tab-content").style.display = "block";
    document.getElementById("admin-matches-tab-content").style.display = "none";
    loadAdminUsers();
  });

  document.getElementById("admin-tab-matches").addEventListener("click", () => {
    document.getElementById("admin-tab-matches").classList.add("active");
    document.getElementById("admin-tab-users").classList.remove("active");
    document.getElementById("admin-users-tab-content").style.display = "none";
    document.getElementById("admin-matches-tab-content").style.display = "block";
    loadAdminMatches();
  });

  // Admin Match Edit Modal listeners
  document.getElementById("close-admin-match-modal").addEventListener("click", () => {
    adminMatchModal.classList.remove("open");
  });
  document.getElementById("cancel-admin-match-btn").addEventListener("click", () => {
    adminMatchModal.classList.remove("open");
  });
  document.getElementById("save-admin-match-btn").addEventListener("click", saveAdminMatchDetails);

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

  // Theme Toggle listener
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("hero-theme");
      const isHero = document.body.classList.contains("hero-theme");
      localStorage.setItem("theme_preference", isHero ? "hero" : "dark");
      updateThemeIcons();
    });
  }

  document.getElementById("security-settings-btn").addEventListener("click", () => {
    showToast("Conexão protegida e assinada.", "info");
  });
  document.getElementById("rules-btn").addEventListener("click", () => {
    showToast("Regras: Placar Exato = 25 pts. Vencedor Correto = 10 pts. Erro = 0 pts.", "info");
  });
  document.getElementById("support-btn").addEventListener("click", () => {
    showToast("Suporte ativo: help@bolao2026.com", "info");
  });
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
}

function updateThemeIcons() {
  const isHero = document.body.classList.contains("hero-theme");
  const sunIcon = document.querySelector("#theme-toggle-btn .sun-icon");
  const moonIcon = document.querySelector("#theme-toggle-btn .moon-icon");
  if (sunIcon && moonIcon) {
    if (isHero) {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    } else {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    }
  }
}

// --- APP INITIALIZER ---
async function init() {
  // Theme Initialization
  const savedTheme = localStorage.getItem("theme_preference");
  if (savedTheme === "hero") {
    document.body.classList.add("hero-theme");
  }
  updateThemeIcons();

  await checkBackendConnectivity();
  loadState();
  initEventListeners();

  const token = localStorage.getItem("bolao_auth_token");
  if (token) {
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
      console.warn("Session auto-login failed.", e);
      localStorage.removeItem("bolao_auth_token");
      appShellContainer.classList.add("auth-required");
    }
  } else {
    appShellContainer.classList.add("auth-required");
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(e => console.log("SW failed", e));
  }

  setInterval(simulateLiveMatchTick, 18000);
}

window.addEventListener("DOMContentLoaded", init);
