// Tic Tac Toe - PvE (Minimax) + PvP + Score tracking + Animations

// Constants
const HUMAN = 'X';
const AI = 'O';
const STORAGE_KEY = 'ttt_scores_v1';

// DOM references
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const aiFirstCheckbox = document.getElementById('ai-first');
const modePve = document.getElementById('mode-pve');
const modePvp = document.getElementById('mode-pvp');
const resetScoresBtn = document.getElementById('reset-scores');

const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreDrawEl = document.getElementById('score-draw');

let board; // array of 9: 'X','O' or null
let gameOver;
let mode = 'pve'; // 'pve' or 'pvp'
let currentPlayer = HUMAN;
let scores = { X: 0, O: 0, draw: 0 };

// Utility - build cells fresh to avoid duplicate listeners
function buildCells() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.dataset.index = i;
    btn.addEventListener('click', onCellClick);
    boardEl.appendChild(btn);
  }
}

// Load/save scores
function loadScores() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      scores = Object.assign({ X: 0, O: 0, draw: 0 }, parsed);
    } catch (e) { scores = { X: 0, O: 0, draw: 0 }; }
  }
  updateScoreUI();
}

function saveScores() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function updateScoreUI() {
  // Show contextual labels: in PVE "You/X" else "Player X"
  const labelX = (mode === 'pve') ? `You/X: ${scores.X}` : `Player X: ${scores.X}`;
  const labelO = (mode === 'pve') ? `AI/O: ${scores.O}` : `Player O: ${scores.O}`;
  scoreXEl.textContent = labelX;
  scoreOEl.textContent = labelO;
  scoreDrawEl.textContent = `Draws: ${scores.draw}`;
}

// Initialize game
function init() {
  board = Array(9).fill(null);
  gameOver = false;
  mode = modePve.checked ? 'pve' : 'pvp';
  currentPlayer = HUMAN;

  buildCells();
  render(); // clears UI
  loadScores(); // update scoreboard labels according to mode

  // If AI first and in PvE, let AI play first
  if (aiFirstCheckbox.checked && mode === 'pve') {
    currentPlayer = AI;
    statusEl.textContent = "AI's turn (O)";
    // slight delay so user sees status change
    setTimeout(() => {
      aiMove();
      render();
      const r = checkGameResult();
      if (r) endGame(r);
      else {
        currentPlayer = HUMAN;
        statusEl.textContent = "Your turn (X)";
      }
    }, 220);
  } else {
    statusEl.textContent = (mode === 'pve') ? "Your turn (X)" : "Player X's turn";
  }
}

// Render UI from board
function render() {
  const cells = Array.from(document.querySelectorAll('.cell'));
  for (let i = 0; i < 9; i++) {
    const c = cells[i];
    const val = board[i];
    c.classList.remove('x', 'o', 'played', 'win', 'disabled');
    if (val) {
      c.textContent = val;
      c.classList.add(val === 'X' ? 'x' : 'o');
      c.classList.add('played');
      c.disabled = true;
      c.classList.add('disabled');
    } else {
      c.textContent = '';
      c.disabled = false;
    }
  }
}

// Validate move
function isValidMove(idx) {
  return idx >= 0 && idx < 9 && board[idx] === null && !gameOver;
}

function makeMove(idx, mark) {
  if (isValidMove(idx)) {
    board[idx] = mark;
  }
}

// Click handler
function onCellClick(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (!isValidMove(idx)) return;

  // In PvE block clicks when it's AI's turn
  if (mode === 'pve' && currentPlayer === AI) return;

  makeMove(idx, currentPlayer);
  render();
  const result = checkGameResult();
  if (result) return endGame(result);

  // switch player
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

  if (mode === 'pvp') {
    statusEl.textContent = `Player ${currentPlayer}'s turn`;
    return;
  }

  // PvE logic: if now AI's turn, let AI play
  if (currentPlayer === AI) {
    statusEl.textContent = "AI's turn (O)";
    setTimeout(() => {
      aiMove();
      render();
      const res = checkGameResult();
      if (res) endGame(res);
      else {
        currentPlayer = HUMAN;
        statusEl.textContent = "Your turn (X)";
      }
    }, 250);
  } else {
    statusEl.textContent = "Your turn (X)";
  }
}

// Check win/draw
function checkGameResult() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  if (board.every(v => v !== null)) return { winner: null };
  return null;
}

function endGame(result) {
  gameOver = true;
  if (result.winner) {
    const winner = result.winner;
    statusEl.textContent = (mode === 'pve' && winner === HUMAN) ? "You won!" :
                           (mode === 'pve' && winner === AI) ? "AI won!" :
                           `${winner} won!`;
    // highlight winning line
    result.line.forEach(i => {
      const cell = document.querySelector(`.cell[data-index="${i}"]`);
      if (cell) cell.classList.add('win');
    });
    // update scores
    scores[winner] = (scores[winner] || 0) + 1;
  } else {
    statusEl.textContent = "It's a draw.";
    scores.draw = (scores.draw || 0) + 1;
  }
  updateScoreUI();
  saveScores();

  // disable remaining cells
  document.querySelectorAll('.cell').forEach(c => {
    c.disabled = true;
    c.classList.add('disabled');
  });
}

// ----- Minimax Implementation -----
const SCORE = { X: -10, O: 10, draw: 0 };

function evaluateBoard(bd) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (bd[a] && bd[a] === bd[b] && bd[b] === bd[c]) return bd[a];
  }
  if (bd.every(v => v !== null)) return 'draw';
  return null;
}

function minimax(boardState, depth, isMaximizing) {
  const result = evaluateBoard(boardState);
  if (result !== null) {
    if (result === 'draw') return SCORE.draw;
    // prefer faster wins / slower losses
    return SCORE[result] + (result === AI ? -depth : depth);
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === null) {
        boardState[i] = AI;
        const val = minimax(boardState, depth + 1, false);
        boardState[i] = null;
        best = Math.max(best, val);
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === null) {
        boardState[i] = HUMAN;
        const val = minimax(boardState, depth + 1, true);
        boardState[i] = null;
        best = Math.min(best, val);
      }
    }
    return best;
  }
}

function findBestMove(boardState) {
  // small optimization: if center free, take it
  if (boardState[4] === null) return 4;

  let bestScore = -Infinity;
  let bestMove = null;
  for (let i = 0; i < 9; i++) {
    if (boardState[i] === null) {
      boardState[i] = AI;
      const score = minimax(boardState, 0, false);
      boardState[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function aiMove() {
  if (gameOver) return;
  const choice = findBestMove(board.slice());
  if (choice !== null && choice !== undefined) {
    makeMove(choice, AI);
  } else {
    // fallback: first empty
    const empties = board.map((v,i) => v === null ? i : -1).filter(i => i >= 0);
    if (empties.length) makeMove(empties[0], AI);
  }
}

// ----- Controls -----
restartBtn.addEventListener('click', () => {
  init();
});

aiFirstCheckbox.addEventListener('change', () => {
  init();
});

modePve.addEventListener('change', () => { init(); });
modePvp.addEventListener('change', () => { init(); });

resetScoresBtn.addEventListener('click', () => {
  scores = { X: 0, O: 0, draw: 0 };
  saveScores();
  updateScoreUI();
});

// Initialize on load
init();
