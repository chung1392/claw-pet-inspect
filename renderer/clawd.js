const stage = document.getElementById('stage');
const sprite = document.getElementById('clawd');
const sparkleLayer = document.getElementById('sparkles');

const FRAME_W = 92;
const FRAME_H = 76;
const IDLE_SLEEP_MS = 90 * 1000;

// one row of clawd-sheet.png per clip
const CLIPS = {
  idle: { row: 0, frames: 6, fps: 6 }, // blink
  walk: { row: 1, frames: 8, fps: 9 },
  scurry: { row: 2, frames: 8, fps: 10 },
  raise: { row: 3, frames: 4, fps: 6 }, // one arm up
  hop: { row: 4, frames: 5, fps: 8 },
  stretch: { row: 5, frames: 8, fps: 8 },
  wave: { row: 6, frames: 6, fps: 8 },
  type: { row: 7, frames: 6, fps: 13 }, // hands blurring over the laptop
  cheer: { row: 8, frames: 6, fps: 9 }, // both arms up
  droop: { row: 9, frames: 8, fps: 8 }, // sags, eyes go sad
  doze: { row: 10, frames: 8, fps: 5 }, // eyes close
  droopRed: { row: 11, frames: 8, fps: 8 }, // droop, tinted red for errors
};

// --- frame player -------------------------------------------------
// a step is { clip, loops, hold, freeze }:
//   loops  how many times to run the clip (Infinity allowed, default 1)
//   hold   ms to sit on the rest frame once the loops are done
//   freeze stay on the last frame until something else is played

let queue = [];
let step = null;
let clip = null;
let frame = 0;
let loopsLeft = 0;
let nextFrameAt = 0;
let holdUntil = 0;
let onDone = null;

function showFrame(index) {
  sprite.style.backgroundPosition = `${-index * FRAME_W}px ${-clip.row * FRAME_H}px`;
}

function play(steps, done) {
  queue = steps.slice();
  onDone = done || null;
  advance(performance.now());
}

function advance(now) {
  step = queue.shift() || null;
  if (!step) {
    clip = null;
    const cb = onDone;
    onDone = null;
    if (cb) cb();
    return;
  }
  clip = CLIPS[step.clip];
  frame = 0;
  loopsLeft = step.loops == null ? 1 : step.loops;
  holdUntil = 0;
  nextFrameAt = now + 1000 / clip.fps;
  showFrame(0);
}

function tick(now) {
  requestAnimationFrame(tick);
  if (!step) return;

  if (holdUntil) {
    if (now >= holdUntil) advance(now);
    return;
  }
  if (now < nextFrameAt) return;
  nextFrameAt = now + 1000 / clip.fps;

  frame += 1;
  if (frame < clip.frames) {
    showFrame(frame);
    return;
  }

  loopsLeft -= 1; // Infinity stays Infinity
  if (loopsLeft > 0) {
    frame = 0;
    showFrame(0);
    return;
  }
  if (step.freeze) {
    frame = clip.frames - 1;
    showFrame(frame);
    nextFrameAt = Infinity;
    return;
  }
  if (step.hold) {
    frame = 0;
    showFrame(0);
    holdUntil = now + step.hold;
    return;
  }
  advance(now);
}

requestAnimationFrame(tick);

// --- states: idle | running | success | fail | sleeping -------------

const FLOURISHES = ['wave', 'stretch', 'walk', 'hop', 'scurry'];

let mode = 'idle';
let sleepAt = 0;

function idleBeat() {
  if (mode !== 'idle') return;
  if (performance.now() >= sleepAt) {
    enterSleeping();
    return;
  }

  const steps = [{ clip: 'idle', hold: 1200 + Math.random() * 2600 }];
  if (Math.random() < 0.4) {
    const pick = FLOURISHES[Math.floor(Math.random() * FLOURISHES.length)];
    const loops = pick === 'walk' || pick === 'scurry' ? 2 : 1;
    steps.push({ clip: pick, loops, hold: 600 });
  }
  play(steps, idleBeat);
}

function enterIdle() {
  mode = 'idle';
  stage.className = 'idle';
  sleepAt = performance.now() + IDLE_SLEEP_MS;
  idleBeat();
}

function enterSleeping() {
  mode = 'sleeping';
  stage.className = 'sleeping';
  play([{ clip: 'doze', freeze: true }]);
}

function enterRunning() {
  mode = 'running';
  stage.className = 'running';
  play([{ clip: 'raise' }, { clip: 'type', loops: Infinity }]);
}

function enterSuccess() {
  mode = 'success';
  stage.className = 'success';
  spawnSparkles();
  play([{ clip: 'cheer', loops: 3 }, { clip: 'wave' }], enterIdle);
}

function enterFail() {
  mode = 'fail';
  stage.className = 'fail';
  play([{ clip: 'droopRed', hold: 1600 }, { clip: 'stretch' }], enterIdle);
}

function spawnSparkles() {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.textContent = ['✨', '⭐', '💥'][i % 3];
    el.style.left = `${58 + Math.random() * 105}px`;
    el.style.top = `${45 + Math.random() * 50}px`;
    el.style.animationDelay = `${Math.random() * 0.2}s`;
    sparkleLayer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

function setState(status) {
  if (status === 'start') enterRunning();
  else if (status === 'success') enterSuccess();
  else if (status === 'fail') enterFail();
  else enterIdle();
}

if (window.clawPet) {
  window.clawPet.onEvent(setState);
}

enterIdle();
