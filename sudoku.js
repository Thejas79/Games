// Simple Sudoku generator + UI
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const difficultyEl = document.getElementById("difficulty");
let solution = null;
let puzzle = null;

function range(n) {
  return [...Array(n).keys()];
}

function copyGrid(g) {
  return g.map((r) => r.slice());
}

// Backtracking solver/generator
function isSafe(grid, row, col, num) {
  for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
  for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
  const sr = Math.floor(row / 3) * 3,
    sc = Math.floor(col / 3) * 3;
  for (let r = sr; r < sr + 3; r++)
    for (let c = sc; c < sc + 3; c++) if (grid[r][c] === num) return false;
  return true;
}

function solve(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isSafe(grid, r, c, n)) {
            grid[r][c] = n;
            if (solve(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateFull() {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  solve(grid);
  return grid;
}

function removeFrom(full, removals) {
  const grid = copyGrid(full);
  const positions = shuffle(range(81));
  for (let i = 0; i < removals; i++) {
    const pos = positions[i];
    const r = Math.floor(pos / 9),
      c = pos % 9;
    grid[r][c] = 0;
  }
  return grid;
}

function newGame() {
  const diff = difficultyEl.value;
  const removals = diff === "easy" ? 41 : diff === "medium" ? 49 : 55;
  const full = generateFull();
  const p = removeFrom(full, removals);
  solution = full;
  puzzle = p;
  render(p);
  status("New game — difficulty: " + diff);
}

function render(grid) {
  boardEl.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const cell = document.createElement("div");
      cell.className = "cell";
      if ((c + 1) % 3 === 0 && c !== 8) cell.classList.add("border-right");
      if ((r + 1) % 3 === 0 && r !== 8) cell.classList.add("border-bottom");
      const input = document.createElement("input");
      input.setAttribute("maxlength", "1");
      input.dataset.row = r;
      input.dataset.col = c;
      input.type = "text";
      if (grid[r][c] !== 0) {
        input.value = grid[r][c];
        input.readOnly = true;
        cell.classList.add("given");
      }
      input.addEventListener("input", onInput);
      input.addEventListener("keydown", onKeyDown);
      cell.appendChild(input);
      boardEl.appendChild(cell);
    }
  }
}

function onKeyDown(e) {
  const k = e.key;
  if (k === "Backspace" || k === "Delete") e.target.value = "";
  if (/[1-9]/.test(k)) {
    e.preventDefault();
    e.target.value = k;
  }
}

function onInput(e) {
  const val = e.target.value.replace(/[^1-9]/g, "");
  e.target.value = val;
}

function status(msg) {
  statusEl.textContent = msg;
}

function check() {
  const inputs = boardEl.querySelectorAll("input");
  let ok = true;
  let incomplete = false;
  inputs.forEach((inp) => {
    const r = +inp.dataset.row,
      c = +inp.dataset.col;
    const v = inp.value ? parseInt(inp.value, 10) : 0;
    if (v === 0) incomplete = true;
    if (v !== 0 && solution && solution[r][c] !== v) {
      ok = false;
      inp.style.background = "rgba(255,0,0,0.12)";
    } else inp.style.background = "transparent";
  });
  if (!ok) status("There are mistakes. Keep trying.");
  else if (incomplete) status("So far so good! Keep going.");
  else status("Congratulations — you solved it!");
}

function hint() {
  // find an empty or incorrect cell
  const inputs = Array.from(boardEl.querySelectorAll("input"));
  const empties = inputs.filter(
    (inp) =>
      !inp.value ||
      parseInt(inp.value, 10) !== solution[+inp.dataset.row][+inp.dataset.col]
  );
  if (empties.length === 0) {
    status("No hints available — puzzle solved or correct.");
    return;
  }
  const chosen = empties[Math.floor(Math.random() * empties.length)];
  const r = +chosen.dataset.row,
    c = +chosen.dataset.col;
  chosen.value = solution[r][c];
  chosen.style.background = "rgba(0,255,0,0.08)";
  status("Hint applied");
}

function solveGame() {
  const inputs = boardEl.querySelectorAll("input");
  inputs.forEach((inp) => {
    const r = +inp.dataset.row,
      c = +inp.dataset.col;
    inp.value = solution[r][c];
    inp.style.background = "rgba(0,255,0,0.04)";
  });
  status("Solved — showing solution");
}

// Controls
document.getElementById("newGame").addEventListener("click", () => {
  newGame();
});
document.getElementById("check").addEventListener("click", check);
document.getElementById("hint").addEventListener("click", hint);
document.getElementById("solve").addEventListener("click", solveGame);
document.getElementById("back").addEventListener("click", () => {
  window.location.href = "index.html";
});

// Start default game
newGame();
