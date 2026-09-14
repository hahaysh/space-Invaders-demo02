import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canSelectDifficulty, createGame, DIFFICULTIES, DifficultyError, getDifficulty,
  restartGame, RULES, selectDifficulty, startGame, togglePause, updateGame,
} from '../src/model.js';

const playing = () => startGame(createGame());
const firingLane = () => {
  const game = playing();
  game.enemies = [{ x: 0, y: 0 }];
  return game;
};
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const advance = (game, seconds, input) => {
  while (seconds > 1e-9) {
    const dt = Math.min(seconds, 0.1);
    updateGame(game, dt, input);
    seconds -= dt;
  }
};

test('difficulty defaults are fresh and definitions cannot be changed', () => {
  assert.equal(createGame().pendingDifficulty, 'normal');
  assert.equal(createGame().currentDifficulty, 'normal');
  assert.deepEqual(Object.keys(DIFFICULTIES), ['easy', 'normal', 'hard']);
  for (const [value, speed] of [['easy', 32], ['normal', 64], ['hard', 96]]) {
    assert.equal(getDifficulty(value).speed, speed);
    assert.ok(Object.isFrozen(DIFFICULTIES[value]));
  }
  assert.ok(Object.isFrozen(DIFFICULTIES));
  selectDifficulty(createGame(), 'hard');
  assert.equal(createGame().pendingDifficulty, 'normal');
});

test('every difficulty can change only pending in title/won/lost; playing/paused lock in the model', () => {
  for (const status of ['title', 'won', 'lost', 'playing', 'paused']) {
    for (const value of Object.keys(DIFFICULTIES)) {
      const game = { ...playing(), status };
      const before = structuredClone(game);
      const allowed = ['title', 'won', 'lost'].includes(status);
      assert.equal(canSelectDifficulty(game), allowed);
      const selected = selectDifficulty(game, value);
      assert.deepEqual(game, before);
      assert.deepEqual(selected, { ...before, pendingDifficulty: allowed ? value : 'normal' });
      if (!allowed) assert.equal(selected, game);
    }
  }
});

test('start and both result restarts apply pending and reset everything else without changing the old round', () => {
  for (const value of Object.keys(DIFFICULTIES)) {
    for (const status of ['title', 'won', 'lost']) {
      const old = playing();
      advance(old, 0.073, { left: true, fire: true });
      old.status = status;
      old.score = 20;
      const selected = selectDifficulty(old, value);
      const before = structuredClone(selected);
      const next = status === 'title' ? startGame(selected) : restartGame(selected);
      assert.deepEqual(next, { ...playing(), pendingDifficulty: value, currentDifficulty: value });
      assert.deepEqual(selected, before);
      assert.equal(selected.currentDifficulty, 'normal');
      assert.notEqual(next.enemies, selected.enemies);
      assert.notEqual(next.player, selected.player);
      assert.notEqual(next.bullets, selected.bullets);
    }
  }
  for (const status of ['playing', 'paused']) {
    const game = { ...startGame(selectDifficulty(createGame(), 'hard')), status };
    assert.equal(startGame(game), game);
    assert.equal(restartGame(game), game);
  }
});

for (const [value, speed] of [['easy', 32], ['normal', 64], ['hard', 96]]) {
  test(`${value} moves at ${speed} px/s with exact activation time, both edges and remaining travel`, () => {
    const game = startGame(selectDifficulty(createGame(), value));
    const time = 0.473;
    advance(game, time);
    near(game.elapsed, time);
    near(game.enemies[0].x, 112 + speed * time);
    assert.equal(game.enemies.length, 24);
    assert.equal(game.score, 0);
    advance(game, 144 / speed - time);
    near(game.enemies[7].x, 760);
    assert.equal(game.enemyDirection, -1);
    assert.equal(game.enemies[0].y, 96);
    advance(game, 256 / speed);
    near(game.enemies[0].x, 0);
    assert.equal(game.enemyDirection, 1);
    assert.equal(game.enemies[0].y, 120);
    game.enemies = [{ x: 759.9, y: 72 }];
    updateGame(game, 0.1);
    near(game.enemies[0].x, 760 - (speed * 0.1 - 0.1));
    assert.equal(game.enemies[0].y, 96);
    assert.equal(game.enemyDirection, -1);
    game.enemies[0].x = 0.1;
    updateGame(game, 0.1);
    near(game.enemies[0].x, speed * 0.1 - 0.1);
    assert.equal(game.enemies[0].y, 120);
    assert.equal(game.enemyDirection, 1);
  });
}

test('invalid difficulty values fail explicitly in every selection state and before any round mutation', () => {
  const invalid = ['', 'unknown', 'NORMAL', 'toString', '__proto__', null, undefined, 32, {}, [], NaN];
  for (const value of invalid) {
    assert.throws(() => getDifficulty(value), DifficultyError);
    for (const status of ['title', 'won', 'lost', 'playing', 'paused']) {
      const game = { ...playing(), status };
      const before = structuredClone(game);
      assert.throws(() => selectDifficulty(game, value), DifficultyError);
      assert.deepEqual(game, before);
      const broken = { ...game, currentDifficulty: value };
      const frozen = structuredClone(broken);
      assert.throws(() => updateGame(broken, 0.1, { right: true, fire: true }), RangeError);
      assert.deepEqual(broken, frozen);
    }
    for (const status of ['title', 'won', 'lost']) {
      const game = { ...playing(), status, pendingDifficulty: value };
      const before = structuredClone(game);
      assert.throws(() => status === 'title' ? startGame(game) : restartGame(game), DifficultyError);
      assert.deepEqual(game, before);
    }
  }
});

test('all difficulties retain settings and exact cooldown across repeated pauses', () => {
  for (const value of Object.keys(DIFFICULTIES)) {
    let game = startGame(selectDifficulty(createGame(), value));
    game.enemies = [{ x: 0, y: 0 }];
    advance(game, 0.07, { right: true, fire: true });
    const control = structuredClone(game);
    for (let cycle = 0; cycle < 3; cycle++) {
      game = togglePause(game);
      const frozen = structuredClone(game);
      assert.equal(selectDifficulty(game, value === 'hard' ? 'easy' : 'hard'), game);
      updateGame(game, 300, { right: true, fire: true });
      assert.deepEqual(game, frozen);
      game = togglePause(game);
      assert.deepEqual(game, control);
    }
    const remaining = game.fireCooldown;
    advance(game, remaining - 0.001, { fire: true });
    assert.equal(game.bullets.length, 1);
    updateGame(game, 0.001, { fire: true });
    assert.equal(game.bullets.length, 2);
    advance(control, remaining - 0.001, { fire: true });
    updateGame(control, 0.001, { fire: true });
    assert.deepEqual(game, control);
  }
});

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
  const game = firingLane();
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
  const game = firingLane();
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

test('initial formation geometry, direction and score match every PRD cell', () => {
  const game = playing();
  assert.equal(RULES.enemyWidth, 40);
  assert.equal(RULES.enemyHeight, 24);
  assert.equal(game.enemies.length, 24);
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 8; column++) {
      assert.deepEqual(game.enemies[row * 8 + column], { x: 112 + 72 * column, y: 72 + 48 * row });
    }
  }
  assert.equal(game.enemyDirection, 1);
  assert.equal(game.score, 0);
  updateGame(game, 0.1);
  near(game.enemies[0].x, 118.4);
  assert.equal(game.enemies[0].y, 72);
});

test('formation reverses and drops once at both exact edges and retains spacing', () => {
  const game = playing();
  advance(game, 2.25);
  assert.equal(game.enemyDirection, -1);
  near(game.enemies[7].x, 760);
  assert.equal(game.enemies[0].y, 96);
  advance(game, 4);
  assert.equal(game.enemyDirection, 1);
  near(game.enemies[0].x, 0);
  assert.equal(game.enemies[0].y, 120);
  updateGame(game, 0.1);
  near(game.enemies[0].x, 6.4);
  assert.equal(game.enemies[0].y, 120);
  near(game.enemies[7].x - game.enemies[0].x, 504);
});

test('remaining enemies define the boundary and overshoot stays inside the canvas', () => {
  const game = playing();
  game.enemies = [{ x: 720, y: 72 }];
  updateGame(game, 0.1);
  near(game.enemies[0].x, 726.4);
  assert.equal(game.enemies[0].y, 72);
  game.enemies[0].x = 759.9;
  updateGame(game, 0.1);
  near(game.enemies[0].x, 753.7);
  assert.equal(game.enemies[0].y, 96);
  assert.equal(game.enemyDirection, -1);
});

test('one bullet removes only one overlapping enemy and awards one score increment', () => {
  const game = playing();
  game.enemies = [{ x: 100, y: 100 }, { x: 100, y: 108 }];
  game.bullets = [{ x: 110, y: 112 }];
  updateGame(game, 0);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.score, 10);
  assert.deepEqual(game.bullets, []);
  assert.equal(game.status, 'playing');
});

test('multiple bullets cannot award the same enemy twice, including later updates', () => {
  const game = playing();
  game.enemies = [{ x: 100, y: 100 }, { x: 300, y: 100 }];
  game.bullets = [{ x: 110, y: 112 }, { x: 111, y: 112 }];
  updateGame(game, 0);
  assert.equal(game.score, 10);
  assert.equal(game.bullets.length, 1);
  assert.equal(game.enemies.length, 1);
  updateGame(game, 0);
  assert.equal(game.score, 10);
});

test('small time steps detect moving bullets without tunneling through enemies', () => {
  const game = playing();
  game.enemies = [{ x: 390, y: 168 }, { x: 100, y: 72 }];
  game.bullets = [{ x: 398, y: 210 }];
  updateGame(game, 0.1);
  assert.equal(game.score, 10);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.bullets.length, 0);
});

test('last enemy collision wins before simultaneous defense-line arrival', () => {
  const game = playing();
  game.enemies = [{ x: 759.5, y: 472 }];
  game.bullets = [{ x: 778, y: 504 }];
  game.score = 230;
  updateGame(game, 0.1);
  assert.equal(game.status, 'won');
  assert.equal(game.score, 240);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.bullets.length, 0);
  near(game.elapsed, 1 / 120);
});

test('a surviving defense-line enemy loses after collision scoring', () => {
  const game = playing();
  game.enemies = [{ x: 100, y: 496 }, { x: 300, y: 496 }];
  game.bullets = [{ x: 110, y: 500 }];
  updateGame(game, 0);
  assert.equal(game.score, 10);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.status, 'lost');
});

test('defense-line threshold uses enemy bottom, not its top', () => {
  const game = playing();
  game.enemies = [{ x: 100, y: 495.999 }];
  updateGame(game, 0);
  assert.equal(game.status, 'playing');
  game.enemies[0].y = 496;
  updateGame(game, 0);
  assert.equal(game.status, 'lost');
});

test('both terminal states freeze all game fields despite movement and fire input', () => {
  for (const outcome of ['won', 'lost']) {
    const game = playing();
    game.enemies = outcome === 'won' ? [] : [{ x: 100, y: 496 }];
    game.bullets = [{ x: 398, y: 300 }];
    game.fireCooldown = 0.1;
    updateGame(game, 0);
    assert.equal(game.status, outcome);
    const frozen = structuredClone(game);
    advance(game, 1, { right: true, fire: true });
    assert.deepEqual(game, frozen);
  }
});

test('restart from either outcome creates fresh nested state and does not reset playing or title', () => {
  for (const status of ['won', 'lost']) {
    const game = playing();
    game.status = status;
    game.player.x = 40;
    game.enemies = [{ x: 600, y: 480 }];
    game.enemyDirection = -1;
    game.score = 230;
    game.bullets = [{ x: 58, y: 300 }];
    game.elapsed = 47;
    game.fireCooldown = 0.15;
    const restarted = restartGame(game);
    assert.deepEqual(restarted, playing());
    assert.notEqual(restarted.player, game.player);
    assert.notEqual(restarted.enemies, game.enemies);
    assert.notEqual(restarted.bullets, game.bullets);
  }
  for (const game of [createGame(), playing()]) assert.equal(restartGame(game), game);
});

test('pause only toggles playing and paused while preserving the same game data', () => {
  const game = firingLane();
  advance(game, 0.07, { right: true, fire: true });
  game.score = 10;
  game.enemyDirection = -1;
  const before = structuredClone(game);
  const paused = togglePause(game);
  assert.deepEqual(paused, { ...before, status: 'paused' });
  assert.equal(paused.player, game.player);
  assert.equal(paused.enemies, game.enemies);
  assert.equal(paused.bullets, game.bullets);
  assert.equal(startGame(paused), paused);
  assert.equal(restartGame(paused), paused);
  assert.deepEqual(togglePause(paused), before);
  for (const status of ['title', 'won', 'lost']) {
    const inactive = { ...before, status };
    const snapshot = structuredClone(inactive);
    assert.equal(togglePause(inactive), inactive);
    assert.deepEqual(inactive, snapshot);
  }
});

test('paused updates freeze every field and retain the invalid delta contract', () => {
  const game = firingLane();
  advance(game, 0.07, { right: true, fire: true });
  const paused = togglePause(game);
  const frozen = structuredClone(paused);
  for (const delta of [0, 0.001, 0.1, 60, 3600]) {
    updateGame(paused, delta, { left: true, right: true, fire: true });
    assert.deepEqual(paused, frozen);
  }
  for (const delta of [-1, NaN, Infinity]) {
    assert.throws(() => updateGame(paused, delta), RangeError);
    assert.deepEqual(paused, frozen);
  }
});

test('pause defers collisions and defense-line decisions until resume', () => {
  for (const hit of [false, true]) {
    const game = playing();
    game.enemies = [{ x: 100, y: RULES.defenseY - RULES.enemyHeight }];
    game.bullets = hit ? [{ x: 110, y: RULES.defenseY - 12 }] : [];
    const paused = togglePause(game);
    const frozen = structuredClone(paused);
    updateGame(paused, 20, { fire: true });
    assert.deepEqual(paused, frozen);
    const resumed = togglePause(paused);
    updateGame(resumed, 0);
    assert.equal(resumed.status, hit ? 'won' : 'lost');
    assert.equal(resumed.score, hit ? RULES.pointsPerEnemy : 0);
    assert.equal(resumed.elapsed, 0);
  }
});

test('resume preserves remaining cooldown at its boundary and excludes all paused time', () => {
  let game = firingLane();
  advance(game, 0.07, { right: true, fire: true });
  const control = structuredClone(game);
  const remaining = game.fireCooldown;
  near(remaining, RULES.fireInterval - 0.07);
  for (let cycle = 0; cycle < 5; cycle++) {
    game = togglePause(game);
    updateGame(game, 300, { right: true, fire: true });
    game = togglePause(game);
    assert.deepEqual(game, control);
  }
  updateGame(game, 0);
  assert.deepEqual(game, control);
  advance(game, remaining - 0.001, { right: true, fire: true });
  advance(control, remaining - 0.001, { right: true, fire: true });
  assert.equal(game.bullets.length, 1);
  near(game.fireCooldown, 0.001);
  updateGame(game, 0.001, { right: true, fire: true });
  updateGame(control, 0.001, { right: true, fire: true });
  assert.equal(game.bullets.length, 2);
  near(game.fireCooldown, RULES.fireInterval);
  near(game.elapsed, RULES.fireInterval);
  assert.deepEqual(game, control);
  for (const dt of [0.016, 0.023, 0.081, 0.1]) {
    updateGame(game, dt, { left: true, fire: true });
    updateGame(control, dt, { left: true, fire: true });
    assert.deepEqual(game, control);
  }
});
