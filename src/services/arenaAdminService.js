const rawArenaUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ARENA_API_URL) || '';

const ARENA_API_BASE_URL = rawArenaUrl || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5050'
    : 'https://arena-backend.onrender.com'
);

function getAuthToken() {
  try {
    return localStorage.getItem('sips_token') || localStorage.getItem('token') || '';
  } catch (e) {
    return '';
  }
}

async function arenaAdminRequest(endpoint, options = {}) {
  const url = `${ARENA_API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Sends shared .flashedu.in SSO auth cookie
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Arena Admin Request Failed: ${response.status}`);
  }

  return data;
}

export const arenaAdminService = {
  // Tournament overview & stats
  getTournamentOverview: () =>
    arenaAdminRequest('/api/arena/tournament/overview', { method: 'GET' }),

  // Seed & Generate Knockout Bracket Tree (K = 512, 256, 128...)
  generateKnockoutBracket: () =>
    arenaAdminRequest('/api/arena/tournament/admin/generate-bracket', { method: 'POST' }),

  // Full Bracket matches list
  getTournamentBracket: () =>
    arenaAdminRequest('/api/arena/tournament/bracket', { method: 'GET' }),

  // God Mode: List all matches with filters
  getAllMatches: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/arena/battle/admin/all${query ? `?${query}` : ''}`;
    return arenaAdminRequest(endpoint, { method: 'GET' });
  },

  // Match details for Live Spectate view
  getMatchDetails: (roomCode) =>
    arenaAdminRequest(`/api/arena/battle/${roomCode}`, { method: 'GET' }),

  // Dispute resolution & walkover override
  forceResolveMatch: ({ roomCode, winnerSlot, winReason = 'WALKOVER' }) =>
    arenaAdminRequest('/api/arena/battle/admin/resolve', {
      method: 'POST',
      body: JSON.stringify({ roomCode, winnerSlot, winReason })
    })
};

export default arenaAdminService;
