import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { FIELD } from './levels.js';

const el = id => document.getElementById(id);
const canvas = el('game-canvas');
const start = el('start-button');
const resume = el('resume-button');
const restart = el('restart-button');
const pause = el('pause-button');
const launch = el('launch-button');
const overlay = el('game-overlay');
const status = el('game-status');
const keys = new Set();
let pointerX;
let previousTime;
let lastStatus;
let failed = false;

function text(id, value) {
  const node = el(id);
  const next = String(value);
  if (node.textContent !== next) node.textContent = next;
}

function fail(error) {
  failed = true;
  console.error('Arkanoid stopped:', error);
  overlay.hidden = false;
  text('overlay-kicker', 'Arcade unavailable');
  text('overlay-title', 'Unable to start');
  text('overlay-description', 'Use a current browser and open this game through a local HTTP server, not a file URL. Check the browser console for details.');
  text('overlay-hint', 'Reload the page after resolving the error.');
  status.textContent = 'The game could not run. See the message above.';
  for (const button of [start, resume, restart, pause, launch]) button.disabled = true;
}

try {
  const game = new Game();
  const renderer = new Renderer(canvas);

  function clearInput() {
    keys.clear();
    pointerX = undefined;
  }

  function focusCanvas() {
    canvas.focus({ preventScroll: true });
  }

  function syncUI() {
    const s = game.state;
    const paused = s.status === 'paused';
    const ended = s.status === 'won' || s.status === 'gameover';
    text('score-value', String(s.score).padStart(6, '0'));
    text('best-value', String(s.best).padStart(6, '0'));
    text('level-value', String(s.levelIndex + 1).padStart(2, '0'));
    text('lives-value', s.lives);
    pause.disabled = !['ready', 'playing', 'paused'].includes(s.status);
    text('pause-button', paused ? 'Resume' : 'Pause');
    pause.setAttribute('aria-pressed', String(paused));
    launch.disabled = s.status !== 'ready';
    start.disabled = false;
    start.hidden = s.status !== 'menu';
    resume.hidden = !paused;
    restart.hidden = !ended;
    overlay.hidden = !['menu', 'paused', 'won', 'gameover'].includes(s.status);

    const messages = {
      menu: 'Arcade ready. Select Start game.',
      ready: `${s.levelName}: press Space, click, or tap to launch.`,
      playing: `${s.levelName}: keep the ball alive!`,
      paused: 'Paused. Resume when you are ready.',
      won: `All five sectors cleared! Final score: ${s.score}.`,
      gameover: `Game over. Final score: ${s.score}. Try again!`,
    };
    text('game-status', messages[s.status]);
    if (s.status === lastStatus) return;
    lastStatus = s.status;
    if (paused) {
      text('overlay-kicker', 'Take a breath');
      text('overlay-title', 'PAUSED');
      text('overlay-description', 'Your game is waiting right here. Resume to keep breaking the grid.');
      text('overlay-hint', 'Press P or Escape to resume.');
      resume.focus({ preventScroll: true });
    } else if (ended) {
      text('overlay-kicker', s.status === 'won' ? 'Mission complete' : 'One more round?');
      text('overlay-title', s.status === 'won' ? 'GRID CLEARED!' : 'GAME OVER');
      text('overlay-description', `You scored ${s.score} points. Your best this session is ${s.best}. Play again to chase a new record.`);
      text('overlay-hint', 'A new game starts with three lives.');
      clearInput();
      restart.focus({ preventScroll: true });
    }
  }

  function newGame() {
    if (failed) return;
    clearInput();
    game.start();
    syncUI();
    focusCanvas();
  }

  function togglePause() {
    if (failed) return;
    clearInput();
    game.togglePause();
    previousTime = undefined;
    syncUI();
    if (['ready', 'playing'].includes(game.state.status)) focusCanvas();
  }

  function launchBall() {
    if (failed) return;
    game.launch();
    syncUI();
    focusCanvas();
  }

  start.addEventListener('click', newGame);
  restart.addEventListener('click', newGame);
  resume.addEventListener('click', togglePause);
  pause.addEventListener('click', togglePause);
  launch.addEventListener('click', launchBall);

  const movement = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']);
  window.addEventListener('keydown', event => {
    if (failed || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const active = ['ready', 'playing', 'paused'].includes(game.state.status);
    if (!active) return;
    if (movement.has(event.code)) {
      if (game.state.status === 'paused') return;
      event.preventDefault();
      pointerX = undefined;
      keys.add(event.code);
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault();
      if (!event.repeat) togglePause();
    } else if (event.code === 'Space') {
      // Keep native Space activation for focused UI buttons.
      if (event.target instanceof Element && event.target.closest('button')) return;
      event.preventDefault();
      if (!event.repeat) launchBall();
    }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));

  function setPointer(event) {
    if (!event.isPrimary) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      pointerX = Math.max(0, Math.min(FIELD.width, (event.clientX - rect.left) * FIELD.width / rect.width));
    }
  }

  canvas.addEventListener('pointermove', setPointer);
  canvas.addEventListener('pointerdown', event => {
    if (failed || !event.isPrimary || event.button !== 0) return;
    if (!['ready', 'playing'].includes(game.state.status)) return;
    event.preventDefault();
    setPointer(event);
    canvas.setPointerCapture(event.pointerId);
    launchBall();
  });
  canvas.addEventListener('pointerup', event => {
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointercancel', () => { pointerX = undefined; });

  function suspend() {
    clearInput();
    previousTime = undefined;
    if (!failed && ['ready', 'playing'].includes(game.state.status)) {
      game.togglePause();
      syncUI();
    }
  }
  window.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    previousTime = undefined;
  });

  function frame(time) {
    if (failed) return;
    try {
      const dt = previousTime === undefined ? 0 : (time - previousTime) / 1000;
      previousTime = time;
      const left = keys.has('ArrowLeft') || keys.has('KeyA');
      const right = keys.has('ArrowRight') || keys.has('KeyD');
      game.update(dt, { axis: Number(right) - Number(left), pointerX });
      renderer.draw(game.state, game.drainEvents(), dt);
      syncUI();
      requestAnimationFrame(frame);
    } catch (error) {
      fail(error);
    }
  }

  syncUI();
  requestAnimationFrame(frame);
} catch (error) {
  fail(error);
}
