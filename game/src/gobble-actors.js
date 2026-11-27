// Gobble Dash actors: the turkey the player steers, the farmer who patrols,
// chases, searches and throws carving knives, and the knives themselves.
// Movement and decisions only; drawing lives in gobble-art.js.

import { collideWithWorld, turkeyHiddenInHay, zoneIndexAt } from './gobble-world.js';

export const TURKEY_RADIUS = 22;
export const FARMER_RADIUS = 26;

export function makeTurkey() {
  return {
    x: 120,
    y: 420,
    vx: 0,
    vy: 0,
    facing: 1,
    feathers: 3,
    stamina: 1,
    dashTime: 0,
    dashCooldown: 0,
    invulnerable: 0,
    heat: 0,
    runPhase: 0,
    hidden: false,
  };
}

export function makeFarmer() {
  return {
    x: 700,
    y: 380,
    vx: 0,
    vy: 0,
    facing: -1,
    state: 'patrol',
    patrolIndex: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    searchTime: 0,
    knifeCooldown: 1.2,
    runPhase: 0,
    alert: 0,
  };
}

const PATROL_POINTS = [
  { x: 650, y: 330 },
  { x: 1050, y: 480 },
  { x: 1450, y: 320 },
  { x: 1950, y: 470 },
  { x: 2350, y: 330 },
  { x: 2750, y: 480 },
  { x: 3150, y: 340 },
];

export function farmerSpeedForZone(zoneIndex) {
  return [118, 132, 146][zoneIndex] ?? 118;
}

export function farmerCanSee(farmer, turkey) {
  const dx = turkey.x - farmer.x;
  const dy = turkey.y - farmer.y;
  const dist = Math.hypot(dx, dy);
  if (turkey.hidden) return dist < 70;
  const sightRange = 430;
  if (dist > sightRange) return false;
  const facingSign = farmer.facing >= 0 ? 1 : -1;
  const ahead = dx * facingSign > -60;
  return ahead || dist < 150;
}

function moveToward(actor, tx, ty, speed, dt) {
  const dx = tx - actor.x;
  const dy = ty - actor.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return dist;
  const step = Math.min(dist, speed * dt);
  actor.x += (dx / dist) * step;
  actor.y += (dy / dist) * step;
  if (Math.abs(dx) > 2) actor.facing = dx > 0 ? 1 : -1;
  return dist;
}

export function updateTurkey(turkey, input, dt) {
  const walkSpeed = 205;
  const dashSpeed = 360;
  let mx = input.axisX;
  let my = input.axisY;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  turkey.dashCooldown = Math.max(0, turkey.dashCooldown - dt);
  if (input.dashPressed && turkey.dashCooldown <= 0 && turkey.stamina > 0.25) {
    turkey.dashTime = 0.32;
    turkey.dashCooldown = 0.9;
    turkey.stamina = Math.max(0, turkey.stamina - 0.35);
  }
  turkey.dashTime = Math.max(0, turkey.dashTime - dt);
  const speed = turkey.dashTime > 0 ? dashSpeed : walkSpeed;
  turkey.vx = mx * speed;
  turkey.vy = my * speed;
  turkey.x += turkey.vx * dt;
  turkey.y += turkey.vy * dt;
  if (mx !== 0) turkey.facing = mx > 0 ? 1 : -1;
  const moving = Math.hypot(turkey.vx, turkey.vy) > 10;
  if (moving) turkey.runPhase += dt * (turkey.dashTime > 0 ? 18 : 11);
  turkey.stamina = Math.min(1, turkey.stamina + dt * 0.22);
  turkey.invulnerable = Math.max(0, turkey.invulnerable - dt);
  collideWithWorld(turkey, TURKEY_RADIUS);
  turkey.hidden = turkeyHiddenInHay(turkey);
  return moving;
}

export function updateFarmer(farmer, turkey, dt, events) {
  const zoneIndex = zoneIndexAt(farmer.x);
  const baseSpeed = farmerSpeedForZone(zoneIndex);
  const sees = farmerCanSee(farmer, turkey);
  farmer.knifeCooldown = Math.max(0, farmer.knifeCooldown - dt);

  if (sees) {
    if (farmer.state !== 'chase') events.push('spotted');
    farmer.state = 'chase';
    farmer.lastSeenX = turkey.x;
    farmer.lastSeenY = turkey.y;
    farmer.alert = 1;
  } else if (farmer.state === 'chase') {
    farmer.state = 'search';
    farmer.searchTime = 2.4;
    events.push('lost');
  }

  if (farmer.state === 'chase') {
    // Cornering: aim a little ahead of where the turkey is running.
    const aimX = turkey.x + turkey.vx * 0.22;
    const aimY = turkey.y + turkey.vy * 0.22;
    moveToward(farmer, aimX, aimY, baseSpeed * 1.12, dt);
    farmer.runPhase += dt * 12;
    const dist = Math.hypot(turkey.x - farmer.x, turkey.y - farmer.y);
    if (dist > 120 && dist < 400 && farmer.knifeCooldown <= 0) {
      farmer.knifeCooldown = 1.6;
      events.push('throw');
    }
  } else if (farmer.state === 'search') {
    const arrived = moveToward(farmer, farmer.lastSeenX, farmer.lastSeenY, baseSpeed, dt) < 14;
    farmer.runPhase += dt * 9;
    if (arrived) {
      farmer.searchTime -= dt;
      farmer.facing = Math.sin(farmer.searchTime * 2.2) > 0 ? 1 : -1;
      if (farmer.searchTime <= 0) {
        farmer.state = 'patrol';
        farmer.alert = 0;
      }
    }
  } else {
    const point = PATROL_POINTS[farmer.patrolIndex % PATROL_POINTS.length];
    const arrived = moveToward(farmer, point.x, point.y, baseSpeed * 0.62, dt) < 16;
    farmer.runPhase += dt * 7;
    if (arrived) farmer.patrolIndex += 1;
    farmer.alert = Math.max(0, farmer.alert - dt * 0.4);
  }
  collideWithWorld(farmer, FARMER_RADIUS);
}

export function makeKnife(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = 430;
  return {
    x: fromX,
    y: fromY,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    spin: 0,
    life: 1.4,
  };
}

export function updateKnives(knives, turkey, dt) {
  let hit = false;
  for (const knife of knives) {
    knife.x += knife.vx * dt;
    knife.y += knife.vy * dt;
    knife.spin += dt * 22;
    knife.life -= dt;
    if (turkey.invulnerable <= 0 && Math.hypot(knife.x - turkey.x, knife.y - turkey.y) < 26) {
      hit = true;
      knife.life = 0;
    }
  }
  return hit;
}

export function farmerCaughtTurkey(farmer, turkey) {
  if (turkey.invulnerable > 0) return false;
  return Math.hypot(farmer.x - turkey.x, farmer.y - turkey.y) < 36;
}
