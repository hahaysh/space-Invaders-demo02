import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, RULES, startGame, updateGame } from '../src/model.js';

const playing = () => startGame(createGame());
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const advance = (game, seconds, input) => {
  while (seconds > 1e-9) {
    const dt = Math.min(seconds, 0.1);
    updateGame(game, dt, input);
    seconds -= dt;
  }
};

test('title is stationary and starting creates a clean playing model once', () => {
  const title = createGame();
  const before = structuredClone(title);
  updateGame(title, 0.1, { right: true, fire: true });
  assert.deepEqual(title, before);
  const game = startGame(title);
  assert.equal(game.status, 'playing');
  assert.deepEqual(game.player, { x: 380, y: 550 });
  assert.equal(game.elapsed, 0);
  assert.equal(game.fireCooldown, 0);
  assert.deepEqual(game.bullets, []);
  assert.equal(startGame(game), game);
  assert.deepEqual(title, before);
});

test('movement speed, opposite directions, and both canvas boundaries match PRD', () => {
  const game = playing();
  updateGame(game, 0.1, { right: true });
  near(game.player.x, 412);
  updateGame(game, 0.1, { left: true, right: true });
  near(game.player.x, 412);
  updateGame(game, 0.1, { left: true });
  near(game.player.x, 380);
  advance(game, 3, { left: true });
  assert.equal(game.player.x, 0);
  advance(game, 3, { right: true });
  assert.equal(game.player.x, 760);
  assert.equal(game.player.y, 550);
});

test('first bullet geometry, upward speed and full exit removal match PRD', () => {
  const game = playing();
  assert.equal(RULES.bulletWidth, 4);
  assert.equal(RULES.bulletHeight, 12);
  updateGame(game, 0, { fire: true });
  assert.deepEqual(game.bullets, [{ x: 398, y: 538 }]);
  updateGame(game, 0.1);
  near(game.bullets[0].y, 478);
  advance(game, 0.8);
  assert.equal(game.bullets.length, 1);
  near(game.bullets[0].y, -2);
  updateGame(game, 0.02);
  assert.equal(game.bullets.length, 0);
});

test('holding fire respects interval and release does not bypass cooldown', () => {
  const game = playing();
  updateGame(game, 0, { fire: true });
  advance(game, 0.199, { fire: true });
  assert.equal(game.bullets.length, 1);
  updateGame(game, 0.001, { fire: true });
  assert.equal(game.bullets.length, 2);
  near(game.bullets[0].y, 418);
  near(game.bullets[1].y, 538);
  updateGame(game, 0.05);
  updateGame(game, 0, { fire: true });
  assert.equal(game.bullets.length, 2);
  advance(game, 0.55, { fire: true });
  assert.equal(game.bullets.length, 5);
});

test('firing follows the current player and movement remains independent', () => {
  const game = playing();
  updateGame(game, 0.1, { right: true });
  updateGame(game, 0, { fire: true });
  near(game.bullets[0].x, 430);
  updateGame(game, 0.1, { left: true });
  near(game.bullets[0].x, 430);
  near(game.player.x, 380);
});

test('long frames are capped and small frame partitions produce the same outcome', () => {
  const capped = playing();
  updateGame(capped, 5, { right: true });
  near(capped.player.x, 412);
  near(capped.elapsed, 0.1);
  const one = playing();
  const split = playing();
  advance(one, 0.4, { right: true, fire: true });
  for (let frame = 0; frame < 48; frame++) updateGame(split, 1 / 120, { right: true, fire: true });
  near(one.player.x, split.player.x);
  near(one.elapsed, split.elapsed);
  assert.equal(one.bullets.length, split.bullets.length);
  one.bullets.forEach((bullet, index) => {
    near(bullet.x, split.bullets[index].x);
    near(bullet.y, split.bullets[index].y);
  });
});

test('invalid delta fails explicitly instead of corrupting state', () => {
  for (const delta of [-1, NaN, Infinity]) {
    assert.throws(() => updateGame(playing(), delta), RangeError);
  }
});

test('irregular frame boundaries do not accumulate firing interval drift', () => {
  const game = playing();
  for (let frame = 0; frame < 25; frame++) {
    updateGame(game, 0.016, { right: true, fire: true });
  }
  assert.equal(game.bullets.length, 3);
  near(game.bullets[0].y, 298);
  near(game.bullets[1].y, 418);
  near(game.bullets[2].y, 538);
  near(game.bullets[1].x, 462);
  near(game.bullets[2].x, 526);
});
