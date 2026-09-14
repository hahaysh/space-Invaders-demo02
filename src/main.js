import {
  canSelectDifficulty, createGame, DIFFICULTIES, DifficultyError, getDifficulty,
  isFinished, nextAttempt, restartGame, RULES, selectDifficulty, startGame, togglePause, updateGame,
} from './model.js';

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const titleScreen = document.querySelector('#title-screen');
const startButton = document.querySelector('#start');
const resultScreen = document.querySelector('#result-screen');
const resultTitle = document.querySelector('#result-title');
const resultDescription = document.querySelector('#result-description');
const restartButton = document.querySelector('#restart');
const retryScreen = document.querySelector('#retry-screen');
const nextButton = document.querySelector('#next-attempt');
const score = document.querySelector('#score');
const lives = document.querySelector('#lives');
const status = document.querySelector('#status');
const difficultySelect = document.querySelector('#difficulty');
const currentDifficulty = document.querySelector('#current-difficulty');
const difficultyError = document.querySelector('#difficulty-error');
const keys = new Set();
const movementKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']);
let game = createGame();
let previousTime = null;

if (!context) {
  status.textContent = 'Canvas 2D를 사용할 수 없습니다. 지원되는 브라우저에서 다시 실행해 주세요.';
  startButton.disabled = true;
  throw new Error('Canvas 2D context is unavailable');
}

function clearInput() {
  keys.clear();
}

for (const [value, { label }] of Object.entries(DIFFICULTIES)) {
  difficultySelect.add(new Option(label, value));
}

function syncDifficulty() {
  difficultySelect.value = game.pendingDifficulty;
  difficultySelect.disabled = !canSelectDifficulty(game);
  currentDifficulty.textContent = game.status === 'title'
    ? '현재 판: 시작 전'
    : `현재 판: ${getDifficulty(game.currentDifficulty).label}`;
}

function withDifficultyError(action) {
  try {
    action();
    difficultyError.textContent = '';
    difficultyError.hidden = true;
  } catch (error) {
    if (!(error instanceof DifficultyError)) throw error;
    difficultyError.textContent = error.message;
    difficultyError.hidden = false;
    syncDifficulty();
  }
}

function enterGame(next) {
  if (next === game) return;
  game = next;
  clearInput();
  previousTime = null;
  titleScreen.hidden = true;
  resultScreen.hidden = true;
  retryScreen.hidden = true;
  status.textContent = '진행 중 · 적 편대를 막아 주세요.';
  score.textContent = String(game.score);
  lives.textContent = String(game.lives);
  syncDifficulty();
  canvas.focus({ preventScroll: true });
  draw();
}

const start = () => withDifficultyError(() => enterGame(startGame(game)));
const restart = () => withDifficultyError(() => enterGame(restartGame(game)));
const retry = () => withDifficultyError(() => enterGame(nextAttempt(game)));
startButton.addEventListener('click', start);
restartButton.addEventListener('click', restart);
nextButton.addEventListener('click', retry);
difficultySelect.addEventListener('change', () => withDifficultyError(() => {
  game = selectDifficulty(game, difficultySelect.value);
  syncDifficulty();
}));
window.addEventListener('keydown', (event) => {
  if (event.target === difficultySelect) return;
  if (game.status === 'title' && event.code === 'Enter') {
    event.preventDefault();
    if (!event.repeat) start();
  } else if (game.status === 'retry' && event.code === 'Enter') {
    event.preventDefault();
    if (!event.repeat) retry();
  } else if (game.status === 'retry' && (event.code === 'KeyR' || event.code === 'KeyP')) {
    event.preventDefault();
  } else if (isFinished(game) && event.code === 'KeyR') {
    event.preventDefault();
    if (!event.repeat) restart();
  } else if ((game.status === 'playing' || game.status === 'paused') && event.code === 'KeyP') {
    event.preventDefault();
    if (!event.repeat) {
      game = togglePause(game);
      clearInput();
      previousTime = null;
      status.textContent = game.status === 'paused'
        ? '일시정지 · P로 재개하세요.'
        : '진행 중 · 적 편대를 막아 주세요.';
      syncDifficulty();
      draw();
    }
  } else if ((game.status === 'playing' || game.status === 'paused' || game.status === 'retry') &&
      movementKeys.has(event.code)) {
    if (game.status === 'retry' && event.target === nextButton && event.code === 'Space') return;
    event.preventDefault();
    if (game.status === 'playing' && !event.repeat) keys.add(event.code);
  }
});
window.addEventListener('keyup', (event) => {
  if (event.target !== difficultySelect &&
      !(event.target === nextButton && event.code === 'Space') &&
      (game.status === 'playing' || game.status === 'paused' || game.status === 'retry') &&
      movementKeys.has(event.code)) {
    event.preventDefault();
  }
  keys.delete(event.code);
});
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInput();
});

function draw() {
  context.fillStyle = '#0c1630';
  context.fillRect(0, 0, RULES.width, RULES.height);
  if (game.status === 'title') return;

  context.strokeStyle = '#e58b9b';
  context.setLineDash([8, 8]);
  context.beginPath();
  context.moveTo(0, RULES.defenseY);
  context.lineTo(RULES.width, RULES.defenseY);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = '#a69bff';
  for (const enemy of game.enemies) {
    context.fillRect(enemy.x, enemy.y, RULES.enemyWidth, RULES.enemyHeight);
  }

  context.fillStyle = '#61e6c4';
  context.beginPath();
  context.moveTo(game.player.x + RULES.playerWidth / 2, game.player.y);
  context.lineTo(game.player.x + RULES.playerWidth, game.player.y + RULES.playerHeight);
  context.lineTo(game.player.x, game.player.y + RULES.playerHeight);
  context.closePath();
  context.fill();

  context.fillStyle = '#ffdf80';
  for (const bullet of game.bullets) {
    context.fillRect(bullet.x, bullet.y, RULES.bulletWidth, RULES.bulletHeight);
  }
}

function frame(time) {
  const delta = previousTime === null ? 0 : (time - previousTime) / 1000;
  previousTime = time;
  const previousStatus = game.status;
  updateGame(game, delta, {
    left: keys.has('ArrowLeft') || keys.has('KeyA'),
    right: keys.has('ArrowRight') || keys.has('KeyD'),
    fire: keys.has('Space'),
  });
  if (score.textContent !== String(game.score)) score.textContent = String(game.score);
  if (lives.textContent !== String(game.lives)) lives.textContent = String(game.lives);
  if (previousStatus !== game.status && (isFinished(game) || game.status === 'retry')) {
    clearInput();
    previousTime = null;
    const won = game.status === 'won';
    const awaitingRetry = game.status === 'retry';
    resultTitle.textContent = won ? '승리!' : '패배';
    resultDescription.textContent = won ? '모든 적을 제거했습니다.' : '모든 목숨을 소진했습니다.';
    status.textContent = awaitingRetry
      ? '재도전 대기 · Enter 또는 다음 시도 버튼으로 시작하세요.'
      : won ? '승리 · 모든 적 제거' : '패배 · 모든 목숨 소진';
    retryScreen.hidden = !awaitingRetry;
    resultScreen.hidden = awaitingRetry;
    syncDifficulty();
    canvas.focus({ preventScroll: true });
  }
  draw();
  requestAnimationFrame(frame);
}

syncDifficulty();
lives.textContent = String(game.lives);
draw();
requestAnimationFrame(frame);
