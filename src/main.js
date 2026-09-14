import { createGame, RULES, startGame, updateGame } from './model.js';

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const titleScreen = document.querySelector('#title-screen');
const startButton = document.querySelector('#start');
const status = document.querySelector('#status');
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

function begin() {
  if (game.status !== 'title') return;
  game = startGame(game);
  clearInput();
  previousTime = null;
  titleScreen.hidden = true;
  status.textContent = '진행 중 · 이동과 발사를 연습하세요.';
  canvas.focus({ preventScroll: true });
  draw();
}

startButton.addEventListener('click', begin);
window.addEventListener('keydown', (event) => {
  if (game.status === 'title' && event.code === 'Enter') {
    event.preventDefault();
    if (!event.repeat) begin();
  } else if (game.status === 'playing' && movementKeys.has(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
});
window.addEventListener('keyup', (event) => {
  if (game.status === 'playing' && movementKeys.has(event.code)) event.preventDefault();
  keys.delete(event.code);
});
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInput();
});

function draw() {
  context.fillStyle = '#0c1630';
  context.fillRect(0, 0, RULES.width, RULES.height);
  if (game.status !== 'playing') return;

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
  updateGame(game, delta, {
    left: keys.has('ArrowLeft') || keys.has('KeyA'),
    right: keys.has('ArrowRight') || keys.has('KeyD'),
    fire: keys.has('Space'),
  });
  draw();
  requestAnimationFrame(frame);
}

draw();
requestAnimationFrame(frame);
