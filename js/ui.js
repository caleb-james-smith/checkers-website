// js/ui.js — Rendering, events, mode and score management

// ── Module-level state ─────────────────────────────────────────────────────

let state     = null;   // current GameState (null when on mode-selection screen)
let aiTimeout = null;   // handle for the pending AI setTimeout
let hoverSqs  = [];     // square indices currently carrying a hover highlight

// Choices made on the mode-selection screen
let selectedMode = null;
let selectedDiff = 'easy';

// ── Constants ──────────────────────────────────────────────────────────────

const DEPTH     = { easy: 2, medium: 4, hard: 6 };
const DELAY_AVA = 800;   // ms between moves in AI vs AI (watchable pace)
const DELAY_HVA = 400;   // ms before AI replies in Human vs AI

// ── Small helpers ──────────────────────────────────────────────────────────

function currentPlayer()  { return state.players.find(p => p.color === state.currentColor); }
function playerFor(color) { return state.players.find(p => p.color === color); }
function formatScore(n)   { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
function cap(s)           { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Theme ──────────────────────────────────────────────────────────────────

function initTheme() {
  const stored     = localStorage.getItem('checkers-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = stored ?? (prefersDark ? 'dark' : 'light');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('checkers-theme', next);
});

// ── Hover highlights ───────────────────────────────────────────────────────

function clearHover() {
  const boardEl = document.getElementById('board');
  hoverSqs.forEach(sq => {
    const el = boardEl.querySelector(`[data-sq="${sq}"]`);
    if (el) el.classList.remove('potential');
  });
  hoverSqs = [];
}

function applyHover(sq) {
  if (!state || state.gameOver || state.selected !== null) return;
  if (currentPlayer().isAI) return;
  if (!isColor(state.board[sq], state.currentColor)) return;

  const boardEl = document.getElementById('board');
  state.allValidMoves.filter(m => m.from === sq).forEach(m => {
    const el = boardEl.querySelector(`[data-sq="${m.to}"]`);
    if (el) { el.classList.add('potential'); hoverSqs.push(m.to); }
  });
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderBoard() {
  hoverSqs = [];   // full re-render invalidates any tracked hover state
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const div  = document.createElement('div');
      const dark = (row + col) % 2 === 1;
      div.className = 'square ' + (dark ? 'dark' : 'light');

      if (dark) {
        const sq = coordsToSquare(row, col);
        div.dataset.sq = sq;

        // Last-move highlight (origin and destination)
        if (state.lastMove &&
            (state.lastMove.from === sq || state.lastMove.to === sq))
          div.classList.add('last-move');

        // Selected square
        if (state.selected === sq) div.classList.add('selected');

        // Valid destinations for the selected piece
        if (state.selected !== null && state.validMoves.some(m => m.to === sq))
          div.classList.add('potential');

        // Piece
        const piece = state.board[sq];
        if (piece !== EMPTY) {
          const p = document.createElement('div');
          p.className = 'piece ' + (isRed(piece) ? 'red' : 'white');
          if (isKing(piece))         p.classList.add('king');
          if (state.selected === sq) p.classList.add('lifted');
          div.appendChild(p);
        }
      }

      boardEl.appendChild(div);
    }
  }
}

function renderScoreCards() {
  state.players.forEach((player, i) => {
    const card    = document.getElementById(`score-card-${i}`);
    const swatch  = document.getElementById(`swatch-${i}`);
    const nameEl  = document.getElementById(`name-${i}`);
    const scoreEl = document.getElementById(`score-${i}`);

    swatch.className    = 'color-swatch ' + player.color;
    scoreEl.textContent = formatScore(player.score);
    nameEl.readOnly     = player.isAI;

    // Don't overwrite the input while the user is actively editing it
    if (document.activeElement !== nameEl) nameEl.value = player.name;

    const isActive = !state.gameOver && player.color === state.currentColor;
    card.classList.toggle('active', isActive);
  });
}

function renderStatus() {
  const el = document.getElementById('status-bar');
  if (state.gameOver) {
    el.textContent = playerFor(state.gameOver).name + ' wins!';
  } else {
    const p = currentPlayer();
    el.textContent = `${p.name}’s turn — ${cap(state.currentColor)}`;
  }
}

function renderAll() {
  renderBoard();
  renderScoreCards();
  renderStatus();
}

// ── Player construction ────────────────────────────────────────────────────

// Build the two-player array for a given mode and game index.
// When `prev` is supplied (new game), names and scores are carried over.
function buildPlayers(mode, gameIndex, prev) {
  const p0Red = gameIndex % 2 === 0; // player[0] is Red on even games

  const templates =
    mode === 'ava' ? [{ name: 'AI 1', isAI: true  }, { name: 'AI 2', isAI: true  }] :
    mode === 'hva' ? [{ name: 'Player 1', isAI: false }, { name: 'AI', isAI: true }] :
                     [{ name: 'Player 1', isAI: false }, { name: 'Player 2', isAI: false }];

  return templates.map((tpl, i) => ({
    name:  prev ? prev[i].name  : tpl.name,
    score: prev ? prev[i].score : 0,
    isAI:  tpl.isAI,
    color: (i === 0) === p0Red ? 'red' : 'white',
  }));
}

// ── Game lifecycle ─────────────────────────────────────────────────────────

function initGame(mode, diff) {
  if (aiTimeout) { clearTimeout(aiTimeout); aiTimeout = null; }
  clearHover();

  const board = initialBoard();
  state = {
    board,
    currentColor:   'red',
    selected:       null,
    validMoves:     [],
    allValidMoves:  getValidMoves(board, 'red'),
    lastMove:       null,
    gameOver:       null,
    players:        buildPlayers(mode, 0, null),
    mode,
    difficulty:     diff,
    gameIndex:      0,
    paused:         false,
  };

  const pauseBtn = document.getElementById('pause-btn');
  pauseBtn.classList.toggle('hidden', mode !== 'ava');
  pauseBtn.textContent = 'Pause';

  renderAll();
  scheduleAI();
}

function startNewGame() {
  if (aiTimeout) { clearTimeout(aiTimeout); aiTimeout = null; }
  clearHover();

  const board = initialBoard();
  state.gameIndex++;
  state.board         = board;
  state.currentColor  = 'red';
  state.selected      = null;
  state.validMoves    = [];
  state.allValidMoves = getValidMoves(board, 'red');
  state.lastMove      = null;
  state.gameOver      = null;
  state.paused        = false;
  state.players       = buildPlayers(state.mode, state.gameIndex, state.players);

  document.getElementById('pause-btn').textContent = 'Pause';

  renderAll();
  scheduleAI();
}

function executeMove(move) {
  clearHover();

  state.board        = applyMove(state.board, move);
  state.lastMove     = move;
  state.selected     = null;
  state.validMoves   = [];
  state.currentColor = state.currentColor === 'red' ? 'white' : 'red';

  const winner = isGameOver(state.board, state.currentColor);
  if (winner) {
    state.gameOver      = winner;
    state.allValidMoves = [];
    playerFor(winner).score += 1;
    renderAll();
    return;
  }

  state.allValidMoves = getValidMoves(state.board, state.currentColor);
  renderAll();
  scheduleAI();
}

function scheduleAI() {
  if (!state || state.gameOver || state.paused) return;
  if (!currentPlayer().isAI) return;

  const delay = state.mode === 'ava' ? DELAY_AVA : DELAY_HVA;
  const depth = DEPTH[state.difficulty];

  aiTimeout = setTimeout(() => {
    aiTimeout = null;
    if (!state || state.gameOver || state.paused) return;
    const move = getBestMove(state.board, state.currentColor, depth);
    if (move) executeMove(move);
  }, delay);
}

// ── Board events (event delegation) ───────────────────────────────────────

const boardEl = document.getElementById('board');

boardEl.addEventListener('click', e => {
  if (!state || state.gameOver) return;
  if (currentPlayer().isAI) return;

  const squareEl = e.target.closest('[data-sq]');
  if (!squareEl) return;
  const sq = parseInt(squareEl.dataset.sq);

  // If a piece is selected and this is a valid destination → move
  if (state.selected !== null) {
    const move = state.validMoves.find(m => m.to === sq);
    if (move) { executeMove(move); return; }
  }

  // Try to select a friendly piece that has legal moves
  const movesFrom = state.allValidMoves.filter(m => m.from === sq);
  if (movesFrom.length > 0) {
    state.selected   = sq;
    state.validMoves = movesFrom;
    clearHover();
    renderBoard();
    renderScoreCards();
    return;
  }

  // Click on an empty or non-movable square → deselect
  if (state.selected !== null) {
    state.selected   = null;
    state.validMoves = [];
    clearHover();
    renderBoard();
  }
});

boardEl.addEventListener('mouseover', e => {
  const squareEl = e.target.closest('[data-sq]');
  clearHover();
  if (squareEl) applyHover(parseInt(squareEl.dataset.sq));
});

boardEl.addEventListener('mouseleave', clearHover);

// ── Control buttons ────────────────────────────────────────────────────────

document.getElementById('pause-btn').addEventListener('click', () => {
  if (!state || state.mode !== 'ava') return;
  state.paused = !state.paused;
  document.getElementById('pause-btn').textContent = state.paused ? 'Resume' : 'Pause';
  if (state.paused) {
    if (aiTimeout) { clearTimeout(aiTimeout); aiTimeout = null; }
  } else {
    scheduleAI();
  }
});

document.getElementById('new-game-btn').addEventListener('click', () => {
  if (state) startNewGame();
});

document.getElementById('change-mode-btn').addEventListener('click', () => {
  if (aiTimeout) { clearTimeout(aiTimeout); aiTimeout = null; }
  state = null;
  clearHover();

  document.querySelectorAll('.mode-btn, .diff-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.diff-btn[data-diff="easy"]').classList.add('active');
  selectedMode = null;
  selectedDiff = 'easy';
  document.getElementById('difficulty-section').classList.add('hidden');
  document.getElementById('start-btn').classList.add('hidden');

  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('mode-screen').classList.remove('hidden');
});

// ── Mode-selection screen ──────────────────────────────────────────────────

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMode = btn.dataset.mode;

    const needsAI = selectedMode === 'hva' || selectedMode === 'ava';
    document.getElementById('difficulty-section').classList.toggle('hidden', !needsAI);
    document.getElementById('start-btn').classList.remove('hidden');
  });
});

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDiff = btn.dataset.diff;
  });
});

document.getElementById('start-btn').addEventListener('click', () => {
  if (!selectedMode) return;
  document.getElementById('mode-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  initGame(selectedMode, selectedDiff);
});

// ── Player name inputs ─────────────────────────────────────────────────────

[0, 1].forEach(i => {
  const input = document.getElementById(`name-${i}`);

  input.addEventListener('input', () => {
    if (!state) return;
    state.players[i].name = input.value;
    renderStatus(); // live update of turn status
  });

  input.addEventListener('blur', () => {
    if (!state || state.players[i].isAI) return;
    if (input.value.trim() === '') {
      const fallback = `Player ${i + 1}`;
      input.value = fallback;
      state.players[i].name = fallback;
      renderStatus();
    }
  });
});

// ── Initialise ─────────────────────────────────────────────────────────────

initTheme();
document.querySelector('.diff-btn[data-diff="easy"]').classList.add('active');
