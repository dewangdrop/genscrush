const rows = 8;
const cols = 8;

const tileTypes = [
  { id: "bee", icon: "🐝" },
  { id: "bear", icon: "🐻" },
  { id: "ant", icon: "🐜" },
  { id: "code", icon: "💻" },
  { id: "block", icon: "🧱" }
];

const typeMap = {};
tileTypes.forEach(t => (typeMap[t.id] = t));

const levels = [
  { name: "Code Assist", target: 300, moves: 15 },
  { name: "Block Assist", target: 700, moves: 22 },
  { name: "Swarm", target: 1300, moves: 28 }
];

let board = [];
let selected = null;
let score = 0;
let movesLeft = 0;
let levelIndex = 0;

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const movesEl = document.getElementById("moves");
const targetEl = document.getElementById("target");
const levelNameEl = document.getElementById("level-name");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart-btn");

function randomTileId() {
  const idx = Math.floor(Math.random() * tileTypes.length);
  return tileTypes[idx].id;
}

function createBoard() {
  board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(randomTileId());
    }
    board.push(row);
  }
}

function renderBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const div = document.createElement("div");
      div.classList.add("tile");
      const id = board[r][c];
      if (id) {
        div.classList.add(id);
        div.textContent = typeMap[id].icon;
      } else {
        div.textContent = "";
      }
      div.dataset.row = r;
      div.dataset.col = c;
      div.addEventListener("click", () => handleTileClick(r, c, div));
      boardEl.appendChild(div);
    }
  }
}

function updateHud() {
  scoreEl.textContent = score;
  movesEl.textContent = movesLeft;
  const level = levels[levelIndex];
  targetEl.textContent = level.target;
  levelNameEl.textContent = `${levelIndex + 1}. ${level.name}`;
}

function handleTileClick(r, c, el) {
  if (movesLeft <= 0) return;

  if (!selected) {
    selected = { r, c };
    el.classList.add("selected");
    return;
  }

  if (selected.r === r && selected.c === c) {
    selected = null;
    el.classList.remove("selected");
    return;
  }

  const prevTileEl = document.querySelector(
    `.tile.selected[data-row="${selected.r}"][data-col="${selected.c}"]`
  );
  if (prevTileEl) prevTileEl.classList.remove("selected");

  if (!isAdjacent(selected.r, selected.c, r, c)) {
    selected = null;
    return;
  }

  trySwap(selected.r, selected.c, r, c);
  selected = null;
}

function isAdjacent(r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function swap(r1, c1, r2, c2) {
  const temp = board[r1][c1];
  board[r1][c1] = board[r2][c2];
  board[r2][c2] = temp;
}

function findMatches() {
  const matched = [];
  const seen = new Set();

  // horizontal
  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const curr = c < cols ? board[r][c] : null;
      const prev = board[r][c - 1];
      if (curr !== prev || prev == null) {
        const runLength = c - runStart;
        if (runLength >= 3 && prev != null) {
          for (let k = 0; k < runLength; k++) {
            const rr = r;
            const cc = runStart + k;
            const key = `${rr},${cc}`;
            if (!seen.has(key)) {
              seen.add(key);
              matched.push({ r: rr, c: cc });
            }
          }
        }
        runStart = c;
      }
    }
  }

  // vertical
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= rows; r++) {
      const curr = r < rows ? board[r][c] : null;
      const prev = board[r - 1][c];
      if (curr !== prev || prev == null) {
        const runLength = r - runStart;
        if (runLength >= 3 && prev != null) {
          for (let k = 0; k < runLength; k++) {
            const rr = runStart + k;
            const cc = c;
            const key = `${rr},${cc}`;
            if (!seen.has(key)) {
              seen.add(key);
              matched.push({ r: rr, c: cc });
            }
          }
        }
        runStart = r;
      }
    }
  }

  return matched;
}

function dropTiles() {
  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (board[r][c] != null) {
        board[writeRow][c] = board[r][c];
        if (writeRow !== r) {
          board[r][c] = null;
        }
        writeRow--;
      }
    }
    for (let r = writeRow; r >= 0; r--) {
      board[r][c] = null;
    }
  }
}

function fillNewTiles() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] == null) {
        board[r][c] = randomTileId();
      }
    }
  }
}

function resolveMatches(matches) {
  if (matches.length === 0) {
    renderBoard();
    checkLevelEnd();
    return;
  }

  score += matches.length * 10;
  updateHud();

  matches.forEach(({ r, c }) => {
    board[r][c] = null;
  });

  dropTiles();
  fillNewTiles();

  const newMatches = findMatches();
  resolveMatches(newMatches);
}

function trySwap(r1, c1, r2, c2) {
  swap(r1, c1, r2, c2);
  const matches = findMatches();
  if (matches.length === 0) {
    swap(r1, c1, r2, c2);
    renderBoard();
    return;
  }

  movesLeft--;
  updateHud();
  statusEl.textContent = "";
  resolveMatches(matches);
}

function checkLevelEnd() {
  const level = levels[levelIndex];

  if (score >= level.target) {
    statusEl.textContent = `Level cleared! ${level.name} ✅`;

    setTimeout(() => {
      if (levelIndex < levels.length - 1) {
        levelIndex++;
        startLevel();
      } else {
        alert("All levels complete! You mastered the Gensyn swarm 😎");
        levelIndex = 0;
        startLevel();
      }
    }, 900);
  } else if (movesLeft <= 0) {
    statusEl.textContent =
      "No moves left. Level failed – Restart Level par click karo.";
  }
}

function startLevel() {
  const level = levels[levelIndex];
  score = 0;
  movesLeft = level.moves;
  statusEl.textContent = "";
  createBoard();
  updateHud();

  // Optional: clear starting matches for cleaner board
  let matches = findMatches();
  if (matches.length > 0) {
    resolveMatches(matches);
  } else {
    renderBoard();
  }
}

restartBtn.addEventListener("click", () => {
  startLevel();
});

// Start game
startLevel();
      
