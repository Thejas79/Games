// run.js
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const restartBtn = document.getElementById("restartBtn");

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener("resize", resize);
  resize();

  // SETTINGS
  const laneWidth = 160;
  const pathWidth = laneWidth * 3;
  const spawnZStart = 3.5;
  const spawnInterval = 900;
  const obstacleSpeedBase = 0.0025;
  const JUMP_TIME = 700;
  const WIN_SECONDS = 360;

  const DOUBLE_PRESS_MS = 320; // double press window
  const TURN_CAMERA_MS = 260; // camera tilt duration for a turn
  const LANE_SHIFT_MS = 160; // smooth lane shift
  const START_GRACE_MS = 600; // ignore collisions right after start/reset

  // STATE
  let running = true;
  let lastFrame = performance.now();
  let requestId = null;

  let obstacles = [];
  let spawnTimer = 0;
  let score = 0;
  let startTime = performance.now();
  let elapsed = 0;

  // Player: logical lane (0..2) and displayLane for smoothing
  let player = {
    laneIndex: 1,
    displayLane: 1,
    isJumping: false,
    jumpStart: 0,
    yOffset: 0,
  };

  // Input / animation
  let lastKeyPress = { left: 0, right: 0 };
  let inputLocked = false;
  let laneAnim = {
    active: false,
    from: 1,
    to: 1,
    start: 0,
    dur: LANE_SHIFT_MS,
  };
  let cameraTilt = {
    active: false,
    dir: 0,
    start: 0,
    dur: TURN_CAMERA_MS,
    angle: 0,
  };

  // Collision grace
  let collisionEnabledAt = performance.now() + START_GRACE_MS;

  // HELPERS
  const now = () => performance.now();

  function project(x, z, extraRotation = 0) {
    const v = 1 - z / spawnZStart;
    let screenX =
      canvas.width / 2 + x * (canvas.width / (pathWidth * 2)) * (0.6 + v * 0.8);
    let screenY = canvas.height * (0.45 + v * 0.5) - v * 120;
    const scale = 0.6 + v * 1.8;

    // quick console helper: call window.testEnd() in DevTools to force game end + overlay
    window.testEnd = function () {
      console.log("window.testEnd() called — forcing endGame.");
      endGame(false);
    };

    function roundRect(r) {
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.w),
        h: Math.round(r.h),
      };
    }

    // camera tilt (small rotation) for turn feel; rotate around center pivot
    if (cameraTilt.active || cameraTilt.angle !== 0) {
      const a = cameraTilt.angle;
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.48;
      const dx = screenX - cx;
      const dy = screenY - cy;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      return { x: cx + rx, y: cy + ry, s: scale, v };
    }

    return { x: screenX, y: screenY, s: scale, v };
  }

  function laneWorldX(lane) {
    return (lane - 1) * laneWidth;
  }
  function laneWorldXFrac(laneFrac) {
    return (laneFrac - 1) * laneWidth;
  }

  // RESET / END
  function resetGame() {
    obstacles = [];
    running = true;
    lastFrame = performance.now();
    spawnTimer = 0;
    score = 0;
    elapsed = 0;
    startTime = performance.now();
    collisionEnabledAt = startTime + START_GRACE_MS;
    player = {
      laneIndex: 1,
      displayLane: 1,
      isJumping: false,
      jumpStart: 0,
      yOffset: 0,
    };
    inputLocked = false;
    laneAnim.active = false;
    cameraTilt.active = false;
    cameraTilt.angle = 0;

    // hide overlay robustly (both class and inline style)
    try {
      overlay.classList.add("hidden");
      overlay.style.display = "none";
    } catch (e) {
      /* ignore if element missing */
    }

    // ensure the loop is running
    if (!requestId) requestId = requestAnimationFrame(loop);
  }

  function endGame(win = false) {
    // guard so we only run once, but if running already false we'll still show overlay (useful for testing)
    if (running === false) {
      console.warn(
        "endGame() called but running already false — forcing overlay show."
      );
    }
    running = false;

    // show overlay robustly
    try {
      overlay.classList.remove("hidden");
      overlay.style.display = "flex";
      overlay.style.visibility = "visible";
      overlay.style.opacity = "1";
    } catch (e) {
      console.error("Overlay show failed:", e);
    }

    overlayTitle.textContent = win ? "You Win!" : "Game Over";
    overlayText.textContent = `Score: ${Math.floor(score)}`;

    // stop the loop
    if (requestId) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }

    console.warn("endGame() fired:", {
      score: Math.floor(score),
      time: elapsed,
      win,
    });
  }

  // Obstacles (local frame x,z)
  function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const type = Math.random() < 0.22 ? "tall" : "box";
    obstacles.push({
      lane,
      x: laneWorldX(lane),
      z: spawnZStart,
      type,
      speedMult: 0.9 + Math.random() * 0.6,
    });
  }

  // Movement helpers
  function startLaneAnim(toLane, duration = LANE_SHIFT_MS) {
    laneAnim.active = true;
    laneAnim.from = player.displayLane;
    laneAnim.to = toLane;
    laneAnim.start = now();
    laneAnim.dur = duration;
    player.laneIndex = toLane; // logical lane updated immediately for collisions
  }

  function startTurn(dir) {
    if (!running || inputLocked) return;
    inputLocked = true;
    // camera tilt begins
    cameraTilt.active = true;
    cameraTilt.dir = dir;
    cameraTilt.start = now();
    cameraTilt.dur = TURN_CAMERA_MS;
    // tilt angle (radians) small for effect
    cameraTilt.angle = ((10 * Math.PI) / 180) * dir;

    // move to extreme lane on double press (simulate full turn)
    const targetLane = dir < 0 ? 0 : 2;
    startLaneAnim(targetLane, TURN_CAMERA_MS);
    // unlock later after camera finish in updateAnimations
  }

  function moveLeft() {
    if (!running || inputLocked) return;
    const newLane = Math.max(0, player.laneIndex - 1);
    if (newLane !== player.laneIndex) startLaneAnim(newLane);
  }
  function moveRight() {
    if (!running || inputLocked) return;
    const newLane = Math.min(2, player.laneIndex + 1);
    if (newLane !== player.laneIndex) startLaneAnim(newLane);
  }

  function handleLeftKeyPress() {
    if (!running) return;
    const t = now();
    if (t - lastKeyPress.left < DOUBLE_PRESS_MS) {
      lastKeyPress.left = 0;
      startTurn(-1);
    } else {
      moveLeft();
      lastKeyPress.left = t;
    }
  }
  function handleRightKeyPress() {
    if (!running) return;
    const t = now();
    if (t - lastKeyPress.right < DOUBLE_PRESS_MS) {
      lastKeyPress.right = 0;
      startTurn(1);
    } else {
      moveRight();
      lastKeyPress.right = t;
    }
  }

  function jump() {
    if (!running) return;
    if (player.isJumping) return;
    player.isJumping = true;
    player.jumpStart = now();
    player.yOffset = 0;
  }

  // Animation updates
  function updateAnimations(current) {
    // lane interpolation
    if (laneAnim.active) {
      const t = Math.min(1, (current - laneAnim.start) / laneAnim.dur);
      const eased = 1 - Math.pow(1 - t, 2);
      player.displayLane =
        laneAnim.from + (laneAnim.to - laneAnim.from) * eased;
      if (t >= 1) {
        laneAnim.active = false;
        player.displayLane = laneAnim.to;
        // if camera tilt not active, unlock input
        if (!cameraTilt.active) inputLocked = false;
      }
    } else {
      player.displayLane = player.laneIndex;
    }

    // camera tilt update (we fade it out smoothly)
    if (cameraTilt.active) {
      const t = Math.min(1, (current - cameraTilt.start) / cameraTilt.dur);
      // ease out
      const eased = 1 - Math.pow(1 - t, 2);
      cameraTilt.angle =
        ((10 * Math.PI) / 180) * cameraTilt.dir * (1 - (1 - eased));
      if (t >= 1) {
        cameraTilt.active = false;
        cameraTilt.angle = 0;
        inputLocked = false;
      }
    } else {
      cameraTilt.angle = 0;
    }
  }

  // MAIN LOOP
  function loop(ts) {
    requestId = requestAnimationFrame(loop);
    if (!running) {
      cancelAnimationFrame(requestId);
      requestId = null;
      return;
    }
    const dt = ts - lastFrame;
    lastFrame = ts;
    spawnTimer += dt;
    elapsed = (ts - startTime) / 1000;
    score += dt * 0.01;

    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnObstacle();
    }

    // update obstacles z (local frame)
    for (let o of obstacles) {
      const sp =
        obstacleSpeedBase * (1 + Math.min(elapsed / 60, 1.5)) * o.speedMult;
      o.z -= sp * dt;
    }
    obstacles = obstacles.filter((o) => o.z > -0.2);

    // player jump update
    if (player.isJumping) {
      const t = now() - player.jumpStart;
      const frac = t / JUMP_TIME;
      if (frac >= 1) {
        player.isJumping = false;
        player.yOffset = 0;
      } else player.yOffset = Math.sin(frac * Math.PI) * 140;
    }

    // SIMPLE, RELIABLE COLLISION CHECK + LOGGING
    if (now() >= collisionEnabledAt) {
      // Project player once
      const playerWorldX = laneWorldXFrac(
        player.displayLane !== undefined ? player.displayLane : player.laneIndex
      );
      const projP = project(playerWorldX, 0.02);
      const s = projP.s;
      const pCenter = { x: projP.x, y: projP.y - (32 * s) / 2 }; // approximate player torso center
      // debug
      // console.log("Player proj center:", Math.round(pCenter.x), Math.round(pCenter.y), "isJumping:", player.isJumping);

      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        // only near obstacles (cheap z gating)
        if (o.z < 0.8 && o.z > -0.6) {
          const projO = project(o.x, o.z);
          const oW = 60 * projO.s * (o.type === "tall" ? 1.0 : 1.2);
          const oH = 60 * projO.s * (o.type === "tall" ? 2.2 : 1.2);
          const oCenter = { x: projO.x, y: projO.y - oH / 2 };

          // compute screen distance between centers
          const dx = Math.abs(pCenter.x - oCenter.x);
          const dy = Math.abs(pCenter.y - oCenter.y);

          // threshold: half widths/heights plus small margin
          const collideX = dx < oW / 2 + 20 * s;
          const collideY = dy < oH / 2 + (32 * s) / 2;

          // log check for debugging (comment out if noisy)
          console.log("COLLISION-CHECK", {
            index: i,
            obstacle: {
              lane: o.lane,
              x: Math.round(o.x),
              z: +o.z.toFixed(2),
              type: o.type,
            },
            projO: {
              x: Math.round(projO.x),
              y: Math.round(projO.y),
              s: +projO.s.toFixed(2),
            },
            pCenter: {
              x: Math.round(pCenter.x),
              y: Math.round(pCenter.y),
              s: +s.toFixed(2),
            },
            dx: Math.round(dx),
            dy: Math.round(dy),
            collideX,
            collideY,
            isJumping: player.isJumping,
          });

          if (collideX && collideY && !player.isJumping) {
            console.log(
              ">>> Collision confirmed by simple check. Obstacle index:",
              i
            );
            endGame(false);
            return;
          }
        }
      }
    }

    // --- END REPLACED COLLISION CHECK ---

    // win
    if (elapsed >= WIN_SECONDS) {
      endGame(true);
      return;
    }

    // update animations
    updateAnimations(now());

    // draw scene
    drawScene();

    // HUD
    scoreEl.textContent = "Score: " + Math.floor(score);
    timerEl.textContent = "Time: " + formatTime(Math.floor(elapsed));
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // DRAWING
  function drawScene() {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

    drawPath();

    // draw obstacles far->near
    const sorted = obstacles.slice().sort((a, b) => b.z - a.z);
    for (let o of sorted) drawObstacle(o);

    drawPlayer();
  }

  function drawPath() {
    const nearW = pathWidth * 2.4;
    const farW = pathWidth * 0.6;
    const pathCenterX = canvas.width / 2;
    const nearY = canvas.height * 0.8;
    const farY = canvas.height * 0.25;

    const leftNear = project(-nearW / 2, 0);
    const rightNear = project(nearW / 2, 0);
    const leftFar = project(-farW / 2, spawnZStart);
    const rightFar = project(farW / 2, spawnZStart);

    ctx.beginPath();
    ctx.moveTo(leftNear.x, leftNear.y);
    ctx.lineTo(rightNear.x, rightNear.y);
    ctx.lineTo(rightFar.x, rightFar.y);
    ctx.lineTo(leftFar.x, leftFar.y);
    ctx.closePath();
    ctx.fillStyle = "#6b4f2b";
    ctx.fill();

    const slices = 14;
    for (let s = 0; s <= slices; s++) {
      const t = s / slices;
      const width = lerp(nearW, farW, t);
      const left = project(-width / 2, spawnZStart * t);
      const right = project(width / 2, spawnZStart * t);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
    }
  }

  function drawObstacle(o) {
    const proj = project(o.x, o.z);
    const w = 60 * proj.s * (o.type === "tall" ? 1.0 : 1.2);
    const h = 60 * proj.s * (o.type === "tall" ? 2.2 : 1.2);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(
      proj.x,
      proj.y + 18 * proj.s,
      w * 0.8,
      10 * proj.s,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#3b3b3b";
    ctx.fillRect(proj.x - w / 2, proj.y - h, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(proj.x - w / 2, proj.y - h, w, h);
  }

  function drawPlayer() {
    const worldX = laneWorldXFrac(player.displayLane);
    const proj = project(worldX, 0.02);
    const baseY = proj.y;
    const s = proj.s;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(proj.x, baseY + 24, 30 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    const headR = 8 * s;
    const bodyH = 32 * s;
    const yOffset = -player.yOffset;

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4 * s;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(proj.x - 8 * s, baseY + yOffset);
    ctx.lineTo(proj.x, baseY - bodyH + yOffset);
    ctx.lineTo(proj.x + 8 * s, baseY + yOffset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(proj.x - 12 * s, baseY - bodyH + 6 * s + yOffset);
    ctx.lineTo(proj.x + 12 * s, baseY - bodyH + 6 * s + yOffset);
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(proj.x, baseY - bodyH - headR + yOffset, headR, 0, Math.PI * 2);
    ctx.fill();
  }

  function project(x, z) {
    // small wrapper to respect cameraTilt.angle if active
    const v = 1 - z / spawnZStart;
    let screenX =
      canvas.width / 2 + x * (canvas.width / (pathWidth * 2)) * (0.6 + v * 0.8);
    let screenY = canvas.height * (0.45 + v * 0.5) - v * 120;
    const scale = 0.6 + v * 1.8;

    if (cameraTilt.active || cameraTilt.angle !== 0) {
      const a = cameraTilt.angle;
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.48;
      const dx = screenX - cx;
      const dy = screenY - cy;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      return { x: cx + rx, y: cy + ry, s: scale, v };
    }
    return { x: screenX, y: screenY, s: scale, v };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Input handlers
  window.addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key === "ArrowLeft") handleLeftKeyPress();
    else if (e.key === "ArrowRight") handleRightKeyPress();
    else if (e.key === "ArrowUp") jump();
  });

  canvas.addEventListener("click", () => {
    if (!running) return;
    jump();
  });

  // touch
  let tStartX = 0,
    tStartY = 0,
    tStartTime = 0,
    lastTap = 0;
  canvas.addEventListener(
    "touchstart",
    (ev) => {
      const t = ev.touches[0];
      tStartX = t.clientX;
      tStartY = t.clientY;
      tStartTime = now();
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchend",
    (ev) => {
      if (!running) return;
      const t = ev.changedTouches[0];
      const dx = t.clientX - tStartX,
        dy = t.clientY - tStartY;
      const nowt = now();
      if (nowt - lastTap < DOUBLE_PRESS_MS) {
        const cx = canvas.width / 2;
        if (t.clientX < cx) startTurn(-1);
        else startTurn(1);
        lastTap = 0;
        return;
      }
      lastTap = nowt;
      const SW = 30;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SW) {
        if (dx > 0) handleRightKeyPress();
        else handleLeftKeyPress();
      } else if (Math.abs(dy) > SW && dy < 0) {
        jump();
      }
    },
    { passive: true }
  );

  restartBtn.addEventListener("click", resetGame);

  // start clean
  resetGame();
  requestId = requestAnimationFrame(loop);
})();
