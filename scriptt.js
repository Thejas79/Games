// Stick Runner - JS
// Ensure you have three image files in the same folder:
// background.jpg (page background), zombie1.png, zombie2.png
// If your filenames differ, update the image src paths below.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const modeSelect = document.getElementById('mode');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highscore');

let running = false;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('stickRunnerHighScore') || '0', 10);
highScoreEl.textContent = highScore;

const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

// Player (stick) properties
const player = {
  x: 60,
  y: CANVAS_H - 60,        // baseline y
  w: 18,
  h: 30,
  vy: 0,
  onGround: true
};

const gravity = 0.9;
const jumpVelocity = -14;

let obstacles = [];
let obstacleTimer = 0;
let obstacleSpawnRate = 120; // frames (will change by difficulty)
let obstacleSpeed = 4;
let frameCount = 0;

// Load obstacle images
const obstacleImgs = [];
const img1 = new Image();
img1.src = 'zombie1.jpg';
const img2 = new Image();
img2.src = 'zombie2.webp';
obstacleImgs.push(img1, img2);

// simple ground visual
const groundHeight = 30;

// center canvas focus to receive keyboard events
canvas.setAttribute('tabindex','0');
canvas.focus();

// Mode configuration
function setDifficulty(mode) {
  if (mode === 'easy') {
    obstacleSpawnRate = 160;
    obstacleSpeed = 3;
  } else if (mode === 'medium') {
    obstacleSpawnRate = 110;
    obstacleSpeed = 4.5;
  } else if (mode === 'hard') {
    obstacleSpawnRate = 80;
    obstacleSpeed = 6;
  }
}

// Reset game
function resetGame() {
  obstacles = [];
  score = 0;
  scoreEl.textContent = score;
  player.y = CANVAS_H - 60;
  player.vy = 0;
  player.onGround = true;
  gameOver = false;
  frameCount = 0;
  obstacleTimer = 0;
}

// Spawn obstacle using one of the two images
function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  // scale obstacles to appropriate size
  const w = 40;
  const h = 55;
  obstacles.push({
    x: CANVAS_W + 10,
    y: CANVAS_H - groundHeight - h,
    w, h,
    img
  });
}

// Basic collision detection rectangle vs rectangle
function collides(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// Draw simple stick figure
function drawPlayer() {
  const px = player.x;
  const py = player.y - player.h; // top of player
  // head
  ctx.beginPath();
  ctx.fillStyle = '#000';
  ctx.arc(px + player.w/2, py + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  // body (line)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + player.w/2, py + 16);
  ctx.lineTo(px + player.w/2, py + 32);
  ctx.stroke();
  // legs
  ctx.beginPath();
  ctx.moveTo(px + player.w/2, py + 32);
  ctx.lineTo(px + player.w/2 - 6, py + 46);
  ctx.moveTo(px + player.w/2, py + 32);
  ctx.lineTo(px + player.w/2 + 6, py + 46);
  ctx.stroke();
  // arms
  ctx.beginPath();
  ctx.moveTo(px + player.w/2, py + 20);
  ctx.lineTo(px + player.w/2 - 12, py + 28);
  ctx.moveTo(px + player.w/2, py + 20);
  ctx.lineTo(px + player.w/2 + 12, py + 28);
  ctx.stroke();
}

// Draw ground
function drawGround() {
  ctx.fillStyle = '#6b8e23'; // green strip
  ctx.fillRect(0, CANVAS_H - groundHeight, CANVAS_W, groundHeight);
}

// Draw obstacles images
function drawObstacles() {
  obstacles.forEach(obs => {
    if (obs.img.complete) {
      // draw image with slight shadow
      ctx.drawImage(obs.img, obs.x, obs.y, obs.w, obs.h);
    } else {
      // fallback box while image loads
      ctx.fillStyle = '#8b4141';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
  });
}

// draw game over text overlay on canvas
function drawGameOver() {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, CANVAS_H/2 - 50, CANVAS_W, 120);

  ctx.fillStyle = '#333';
  ctx.font = '26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('You collided with a zombie! — Press Restart to play again', CANVAS_W/2, CANVAS_H/2 - 6);
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Final score: ' + score, CANVAS_W/2, CANVAS_H/2 + 22);
}

// Main update loop
function update() {
  if (!running) return;
  frameCount++;
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);

  // background for the canvas is transparent; ground and objects are drawn
  // update player physics
  if (!player.onGround || player.vy !== 0) {
    player.vy += gravity;
    player.y += player.vy;
    if (player.y >= CANVAS_H - 60) {
      player.y = CANVAS_H - 60;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
  }

  // spawn obstacles based on timer (randomize a little)
  obstacleTimer++;
  const spawnRate = Math.max(40, obstacleSpawnRate + Math.floor((Math.random()-0.5)*30));
  if (obstacleTimer >= spawnRate) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  // move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= obstacleSpeed;
    // check for collision with an approximated player box
    const playerBox = {
      x: player.x - 6,
      y: player.y - player.h,
      w: player.w + 12,
      h: player.h + 18
    };
    const obsBox = { x: o.x, y: o.y, w: o.w, h: o.h };
    if (collides(playerBox, obsBox)) {
      // collision => game over
      running = false;
      gameOver = true;
      // update highscore
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('stickRunnerHighScore', highScore);
        highScoreEl.textContent = highScore;
      }
    }
    // remove off-screen obstacles and reward score
    if (o.x + o.w < -10) {
      obstacles.splice(i,1);
      score += 10; // points for passing one obstacle
      scoreEl.textContent = score;
    }
  }

  // Draw scene
  // subtle sky band
 ctx.fillStyle = 'rgba(240,240,240,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H - groundHeight);

  drawGround();
  drawPlayer();
  drawObstacles();

  // score increment gradually with time (small)
  if (frameCount % 6 === 0) {
    score += 1;
    scoreEl.textContent = score;
  }

  // if game ended draw overlay
  if (gameOver) {
    drawGameOver();
    return;
  }

  requestAnimationFrame(update);
}

// Event listeners for jump
function doJump() {
  if (gameOver) return;
  if (player.onGround) {
    player.vy = jumpVelocity;
    player.onGround = false;
  } else {
    // allow small double bump (optional): do nothing for simplicity
  }
}

canvas.addEventListener('click', () => {
  doJump();
  canvas.focus();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    doJump();
  }
});

// Start / Restart
startBtn.addEventListener('click', () => {
  setDifficulty(modeSelect.value);
  if (!running) {
    resetGame();
    running = true;
    update();
  }
});

restartBtn.addEventListener('click', () => {
  setDifficulty(modeSelect.value);
  resetGame();
  running = true;
  update();
});

// update difficulty when changed while running
modeSelect.addEventListener('change', () => {
  setDifficulty(modeSelect.value);
});

// Initialize
setDifficulty(modeSelect.value);
scoreEl.textContent = score;
highScoreEl.textContent = highScore;

// preload images then draw a small intro on canvas
Promise.all(obstacleImgs.map(img => new Promise(r => {
  if (img.complete) r();
  else img.onload = r;
}))).then(() => {
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#333';
  ctx.font = '20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press Start to begin', CANVAS_W/2, CANVAS_H/2 - 6);
});
