const stage = document.getElementById('stage');
const sparkleLayer = document.getElementById('sparkles');
const canvas = document.getElementById('crab');
const ctx = canvas.getContext('2d');

const PX = 14; // pixel-art cell size in device pixels

const PALETTES = {
  idle: '#da7756',
  running: '#da7756',
  success: '#ec9269',
  fail: '#c1503a',
};

const EYE_COLOR = '#141414';
const KEY_TOP_COLOR = '#d8d8d8';
const KEY_BASE_COLOR = '#8a8a8a';

const LEG_COLS = [3, 5, 7, 9];
const LEG_TOP_ROW = 5;

const WAVE_COLS = [0, 12]; // just outside the claw tabs
const WAVE_UP_ROW = 1;
const WAVE_DOWN_ROW = 2;

// --- static crab silhouette, built once ---
function addRange(set, rows, colStart, colEnd) {
  for (let r = rows[0]; r <= rows[1]; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      set.add(`${r},${c}`);
    }
  }
}

// front-facing pose: used in every state
const bodySet = new Set();
addRange(bodySet, [0, 1], 3, 9); // top cap
addRange(bodySet, [2, 3], 1, 11); // claw band with side tabs
addRange(bodySet, [4, 4], 3, 9); // lower body

const eyeSet = new Set();
addRange(eyeSet, [1, 1], 4, 4);
addRange(eyeSet, [1, 1], 8, 8);

// laptop typing pose (running): arms drop from the claw tabs to a keyboard below
const ARM_COLS = [1, 11]; // aligned with the claw tabs
const ARM_TOP_ROW = 5;
const ARM_BOTTOM_ROW = 6;
const HAND_UP_ROW = 7;
const HAND_DOWN_ROW = 8;
const KEYBOARD_COL = 1;
const KEYBOARD_WIDTH = 11;

function px(gx, gy, gw, gh, color) {
  ctx.fillStyle = color;
  ctx.fillRect(gx * PX, gy * PX, gw * PX, gh * PX);
}

function drawSet(cells, color) {
  for (const key of cells) {
    const [r, c] = key.split(',').map(Number);
    px(c, r, 1, 1, color);
  }
}

// --- state machine: 'idle' | 'running' | 'complete' ---
let state = 'idle';
let completeColor = 'success';
let tickPhase = 0; // flips continuously, drives typing / leg animation
let waving = false; // true while a wave flap is in progress (idle or complete)
let waveIdleTimer = null;
let waveFlapTimer = null;
let completeTimer = null;
let completeJumpInterval = null;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const color = state === 'complete' ? PALETTES[completeColor] : PALETTES[state];

  drawSet(bodySet, color);
  drawSet(eyeSet, EYE_COLOR);

  if (state === 'running') {
    drawTyping(color);
  } else {
    drawLegs(color);
    if (waving) drawWaveHands(color);
  }
}

function drawLegs(color) {
  LEG_COLS.forEach((col) => {
    px(col, LEG_TOP_ROW, 1, 2, color);
  });
}

function drawWaveHands(color) {
  WAVE_COLS.forEach((col, i) => {
    const row = (i + tickPhase) % 2 === 0 ? WAVE_UP_ROW : WAVE_DOWN_ROW;
    px(col, row, 1, 1, color);
  });
}

function drawTyping(color) {
  px(KEYBOARD_COL, HAND_DOWN_ROW + 1, KEYBOARD_WIDTH, 1, KEY_TOP_COLOR);
  px(KEYBOARD_COL, HAND_DOWN_ROW + 2, KEYBOARD_WIDTH, 2, KEY_BASE_COLOR);

  ARM_COLS.forEach((col, i) => {
    for (let r = ARM_TOP_ROW; r <= ARM_BOTTOM_ROW; r++) {
      px(col, r, 1, 1, color);
    }
    const handRow = (i + tickPhase) % 2 === 0 ? HAND_UP_ROW : HAND_DOWN_ROW;
    px(col, handRow, 1, 1, color);
  });
}

// continuous ticker: drives typing hands while running, and wave flaps when active
setInterval(() => {
  tickPhase = tickPhase === 0 ? 1 : 0;
  if (state === 'running' || waving) draw();
}, 220);

// --- idle: wave once every 10s ---
function startIdleWaveLoop() {
  clearInterval(waveIdleTimer);
  waveIdleTimer = setInterval(() => {
    if (state === 'idle') doWaveFlap(4);
  }, 10000);
}

function doWaveFlap(flaps) {
  waving = true;
  let count = 0;
  clearInterval(waveFlapTimer);
  waveFlapTimer = setInterval(() => {
    count++;
    if (count >= flaps) {
      clearInterval(waveFlapTimer);
      waving = false;
      draw();
    }
  }, 220);
}

// --- running: typing on the laptop ---
function enterRunning() {
  clearTimers();
  state = 'running';
  stage.className = 'running';
  draw();
}

// --- complete: wave both hands while jumping 5 times ---
function enterComplete(status) {
  clearTimers();
  state = 'complete';
  completeColor = status;
  stage.className = 'complete';
  if (status === 'success') spawnSparkles();

  waving = true;
  draw();
  completeJumpInterval = setInterval(() => {
    tickPhase = tickPhase === 0 ? 1 : 0;
    draw();
  }, 250);

  completeTimer = setTimeout(() => {
    clearInterval(completeJumpInterval);
    waving = false;
    enterIdle();
  }, 5 * 500);
}

function enterIdle() {
  clearTimers();
  state = 'idle';
  stage.className = 'idle';
  draw();
}

function clearTimers() {
  clearInterval(waveFlapTimer);
  clearInterval(completeJumpInterval);
  clearTimeout(completeTimer);
  waving = false;
}

function spawnSparkles() {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.textContent = ['✨', '⭐', '💥'][i % 3];
    el.style.left = `${20 + Math.random() * 160}px`;
    el.style.top = `${20 + Math.random() * 90}px`;
    el.style.animationDelay = `${Math.random() * 0.2}s`;
    sparkleLayer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

function setState(status) {
  if (status === 'start') {
    enterRunning();
  } else if (status === 'success' || status === 'fail') {
    enterComplete(status);
  } else {
    enterIdle();
  }
}

if (window.clawPet) {
  window.clawPet.onEvent(setState);
}

startIdleWaveLoop();
draw();
