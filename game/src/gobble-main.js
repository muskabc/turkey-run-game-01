// Gobble Dash main loop: game state, fixed-step updates, camera, rendering,
// staged screenshot poses (?shot=title|farmyard|kitchen|escaped) and a
// headless self-test (?selftest=1) that exercises the world and actor rules.

import {
  VIEW_H,
  VIEW_W,
  clampCamera,
  drawBackdrop,
  drawCrates,
  drawFarmer,
  drawGate,
  drawHayBales,
  drawKnife,
  drawOvens,
  drawPickup,
  drawTurkey,
  drawZoneSigns,
} from './gobble-art.js';
import {
  farmerCaughtTurkey,
  makeFarmer,
  makeKnife,
  makeTurkey,
  updateFarmer,
  updateKnives,
  updateTurkey,
} from './gobble-actors.js';
import { BUTTONS, buttonHit, drawEndScreen, drawHud, drawPauseScreen, drawTitleScreen } from './gobble-hud.js';
import { clearOneShots, makeInput, readAxes } from './gobble-input.js';
import { makeSound } from './gobble-sound.js';
import { GATE_X, makePickups, ovenAt } from './gobble-world.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const announcer = document.getElementById('announcer');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const selftestMode = params.get('selftest') === '1';

function seededRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const seed = Number(params.get('seed') ?? '7') || 7;

function freshGame() {
  const random = seededRandom(seed);
  return {
    screen: 'title',
    turkey: makeTurkey(),
    farmer: makeFarmer(),
    knives: [],
    pickups: makePickups(random),
    score: 0,
    cornEaten: 0,
    time: 0,
    cameraX: 0,
    escaped: false,
    message: '',
    messageTime: 0,
    sizzleCooldown: 0,
  };
}

let game = freshGame();
const input = makeInput(canvas);
const sound = makeSound();

function announce(text) {
  if (announcer) announcer.textContent = text;
}

function showMessage(text) {
  game.message = text;
  game.messageTime = 2.2;
}

function loseFeather(reason) {
  const turkey = game.turkey;
  if (turkey.invulnerable > 0) return;
  turkey.feathers -= 1;
  turkey.invulnerable = 1.6;
  turkey.heat = 0;
  sound.hurt();
  if (turkey.feathers <= 0) {
    game.screen = 'end';
    game.escaped = false;
    sound.caught();
    announce('Caught! The farmer got his dinner. Press R to run again.');
  } else {
    showMessage(reason + ' Feather lost! ' + turkey.feathers + ' left');
    announce(reason + ' Feather lost. ' + turkey.feathers + ' feathers left.');
    // Knock the turkey away from the farmer so a catch is not instant death.
    const dx = turkey.x - game.farmer.x;
    const dy = turkey.y - game.farmer.y;
    const dist = Math.hypot(dx, dy) || 1;
    turkey.x += (dx / dist) * 90;
    turkey.y += (dy / dist) * 60;
  }
}

function stepGame(dt, scripted) {
  const turkey = game.turkey;
  const farmer = game.farmer;
  game.time += dt;
  game.messageTime = Math.max(0, game.messageTime - dt);

  const turkeyScreenX = turkey.x - game.cameraX;
  if (scripted) {
    input.axisX = scripted.axisX;
    input.axisY = scripted.axisY;
    input.dashPressed = Boolean(scripted.dash);
  } else {
    readAxes(input, turkeyScreenX, turkey.y);
  }
  const wasDashing = turkey.dashTime > 0;
  updateTurkey(turkey, input, dt);
  if (!wasDashing && turkey.dashTime > 0 && !scripted) sound.gobble();

  const events = [];
  updateFarmer(farmer, turkey, dt, events);
  for (const eventName of events) {
    if (eventName === 'spotted') {
      sound.spotted();
      showMessage('SPOTTED!');
    }
    if (eventName === 'throw') {
      game.knives.push(makeKnife(farmer.x, farmer.y - 6, turkey.x, turkey.y));
      sound.knifeThrow();
    }
  }

  if (updateKnives(game.knives, turkey, dt)) {
    loseFeather('Knife hit!');
  }
  game.knives = game.knives.filter((knife) => knife.life > 0);

  if (farmerCaughtTurkey(farmer, turkey)) {
    loseFeather('Grabbed!');
  }

  // Oven heat builds while standing in the glow.
  game.sizzleCooldown = Math.max(0, game.sizzleCooldown - dt);
  if (ovenAt(turkey.x, turkey.y)) {
    turkey.heat += dt * 0.85;
    if (game.sizzleCooldown <= 0) {
      sound.sizzle();
      game.sizzleCooldown = 0.5;
    }
    if (turkey.heat >= 1) loseFeather('Roasted!');
  } else {
    turkey.heat = Math.max(0, turkey.heat - dt * 1.4);
  }

  for (const pickup of game.pickups) {
    if (pickup.taken) continue;
    if (Math.hypot(pickup.x - turkey.x, pickup.y - turkey.y) < 34) {
      pickup.taken = true;
      if (pickup.kind === 'corn') {
        game.score += 50;
        game.cornEaten += 1;
        turkey.stamina = Math.min(1, turkey.stamina + 0.45);
        sound.corn();
        showMessage('Corn! +50');
      } else if (pickup.kind === 'pumpkin') {
        game.score += 150;
        sound.corn();
        showMessage('Pumpkin! +150');
      } else {
        turkey.feathers = Math.min(5, turkey.feathers + 1);
        game.score += 100;
        sound.golden();
        showMessage('Golden corn! +1 feather');
      }
    }
  }

  game.score += Math.floor(dt * 6);
  if (turkey.x >= GATE_X) {
    game.screen = 'end';
    game.escaped = true;
    game.score += 500 + turkey.feathers * 100;
    sound.escaped();
    announce('You escaped! The turkey lives. Press R to run again.');
  }
  game.cameraX = clampCamera(turkey.x);
}

function render() {
  const cameraX = game.cameraX;
  if (game.screen === 'title') {
    drawTitleScreen(ctx, game, buttonHit(BUTTONS.play, input.pointerX, input.pointerY));
    return;
  }
  drawBackdrop(ctx, cameraX, game.time);
  drawGate(ctx, cameraX, game.time);
  drawOvens(ctx, cameraX, game.time);
  drawCrates(ctx, cameraX);
  for (const pickup of game.pickups) drawPickup(ctx, pickup, cameraX, game.time);
  drawFarmer(ctx, game.farmer, cameraX);
  drawTurkey(ctx, game.turkey, cameraX);
  drawHayBales(ctx, cameraX);
  for (const knife of game.knives) drawKnife(ctx, knife, cameraX);
  drawZoneSigns(ctx, cameraX);
  drawHud(ctx, game);
  if (game.screen === 'paused') {
    drawPauseScreen(ctx, buttonHit(BUTTONS.resume, input.pointerX, input.pointerY));
  }
  if (game.screen === 'end') {
    drawEndScreen(ctx, game, buttonHit(BUTTONS.restart, input.pointerX, input.pointerY));
  }
}

function startRun() {
  const keepScreen = 'playing';
  game = freshGame();
  game.screen = keepScreen;
  sound.unlock();
  sound.click();
  announce('Run! Reach the Freedom Gate. Hide in hay, dodge knives and ovens.');
}

function handleScreens() {
  if (game.screen === 'title') {
    if (input.confirmPressed || (input.clicked && buttonHit(BUTTONS.play, input.clickX, input.clickY))) {
      startRun();
    }
  } else if (game.screen === 'playing') {
    if (input.pausePressed) game.screen = 'paused';
    if (input.restartPressed) startRun();
  } else if (game.screen === 'paused') {
    if (input.pausePressed || input.confirmPressed || (input.clicked && buttonHit(BUTTONS.resume, input.clickX, input.clickY))) {
      game.screen = 'playing';
      sound.click();
    }
    if (input.restartPressed) startRun();
  } else if (game.screen === 'end') {
    if (input.restartPressed || input.confirmPressed || (input.clicked && buttonHit(BUTTONS.restart, input.clickX, input.clickY))) {
      startRun();
    }
  }
}

// Staged poses for screenshots: set the scene, warm it up with scripted
// steps so everything is mid-motion, then hold still and render.
function stageShot(name) {
  game = freshGame();
  if (name === 'title') {
    game.screen = 'title';
    game.time = 3;
    return;
  }
  game.screen = 'playing';
  if (name === 'farmyard') {
    game.turkey.x = 780;
    game.turkey.y = 430;
    game.farmer.x = 615;
    game.farmer.y = 415;
    game.farmer.state = 'chase';
    game.score = 1250;
    game.cornEaten = 6;
    for (let i = 0; i < 16; i += 1) stepGame(1 / 60, { axisX: 0.85, axisY: -0.2, dash: i === 6 });
    game.farmer.state = 'chase';
    game.farmer.alert = 1;
    game.message = 'Corn! +50';
    game.messageTime = 2;
  } else if (name === 'kitchen') {
    game.turkey.x = 2940;
    game.turkey.y = 415;
    game.turkey.feathers = 2;
    game.turkey.heat = 0.45;
    game.farmer.x = 2760;
    game.farmer.y = 405;
    game.farmer.state = 'chase';
    game.score = 3400;
    game.cornEaten = 14;
    for (let i = 0; i < 10; i += 1) stepGame(1 / 60, { axisX: 0.7, axisY: 0.25, dash: false });
    game.farmer.state = 'chase';
    game.farmer.alert = 1;
    game.turkey.heat = 0.45;
    const stagedKnife = makeKnife(game.farmer.x, game.farmer.y - 6, game.turkey.x, game.turkey.y);
    stagedKnife.x = game.turkey.x - 95;
    stagedKnife.y = game.turkey.y - 12;
    game.knives = [stagedKnife];
  } else if (name === 'escaped') {
    game.turkey.x = GATE_X + 30;
    game.turkey.feathers = 2;
    game.score = 5200;
    game.cornEaten = 19;
    game.time = 96;
    game.screen = 'end';
    game.escaped = true;
    game.cameraX = clampCamera(game.turkey.x);
  }
}

function runSelftest() {
  const results = [];
  function check(label, ok) {
    results.push({ label, ok: Boolean(ok) });
  }
  const g = freshGame();
  g.screen = 'playing';
  check('turkey starts with 3 feathers', g.turkey.feathers === 3);
  check('farmer starts on patrol', g.farmer.state === 'patrol');
  check('pickups include golden corn', g.pickups.some((p) => p.kind === 'golden'));
  const startX = g.turkey.x;
  for (let i = 0; i < 30; i += 1) updateTurkey(g.turkey, { axisX: 1, axisY: 0, dashPressed: false }, 1 / 60);
  check('turkey moves right under input', g.turkey.x > startX + 40);
  g.turkey.x = 480;
  g.turkey.y = 335;
  updateTurkey(g.turkey, { axisX: 0, axisY: 0, dashPressed: false }, 1 / 60);
  check('turkey hides inside a hay bale', g.turkey.hidden === true);
  g.farmer.x = 300;
  g.farmer.y = 335;
  g.farmer.facing = 1;
  const events = [];
  updateFarmer(g.farmer, g.turkey, 1 / 60, events);
  check('farmer cannot spot a hidden turkey at range', g.farmer.state !== 'chase');
  g.turkey.x = 560;
  g.turkey.hidden = false;
  updateFarmer(g.farmer, g.turkey, 1 / 60, events);
  check('farmer chases a visible turkey', g.farmer.state === 'chase');
  const knife = makeKnife(0, 0, 100, 0);
  check('knife flies toward its target', knife.vx > 400 && Math.abs(knife.vy) < 1);
  check('oven lookup finds the kitchen oven', ovenAt(2620, 280) !== null);
  check('oven lookup misses the farmyard', ovenAt(200, 300) === null);
  g.turkey.invulnerable = 0;
  g.farmer.x = g.turkey.x + 10;
  g.farmer.y = g.turkey.y;
  check('farmer grab registers at close range', farmerCaughtTurkey(g.farmer, g.turkey));
  const passed = results.filter((r) => r.ok).length;
  ctx.fillStyle = '#1b1208';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = passed === results.length ? '#8bc34a' : '#ef5350';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SELFTEST ' + (passed === results.length ? 'PASS' : 'FAIL') + ' ' + passed + '/' + results.length, 40, 70);
  ctx.font = '22px monospace';
  results.forEach((r, i) => {
    ctx.fillStyle = r.ok ? '#c5e1a5' : '#ef9a9a';
    ctx.fillText((r.ok ? 'ok   ' : 'FAIL ') + r.label, 40, 120 + i * 34);
  });
  announce('Selftest ' + passed + ' of ' + results.length + ' passed.');
}

let lastStamp = 0;
let accumulator = 0;
function frame(stamp) {
  requestAnimationFrame(frame);
  if (selftestMode) return;
  if (shotName) {
    render();
    return;
  }
  const dt = Math.min(0.1, (stamp - lastStamp) / 1000 || 0);
  lastStamp = stamp;
  handleScreens();
  if (game.screen === 'playing') {
    accumulator += dt;
    while (accumulator >= 1 / 60) {
      stepGame(1 / 60, null);
      accumulator -= 1 / 60;
      if (game.screen !== 'playing') break;
    }
  } else {
    game.time += dt;
  }
  clearOneShots(input);
  render();
}

if (selftestMode) {
  runSelftest();
} else if (shotName) {
  stageShot(shotName);
  render();
  requestAnimationFrame(frame);
} else {
  requestAnimationFrame(frame);
}
