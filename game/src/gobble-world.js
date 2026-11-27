// Gobble Dash world data: the three zones of the escape route, the hay bales
// the turkey can hide in, crates that block the way, kitchen ovens, pickups
// and the Freedom Gate. Pure data plus geometry helpers; no drawing here.

export const WORLD_WIDTH = 3600;
export const WORLD_TOP = 150;
export const WORLD_BOTTOM = 668;
export const GATE_X = 3460;

export const ZONES = [
  { name: 'The Farmyard', x0: 0, x1: 1200, skyTop: '#f9d976', skyBottom: '#f39f5a', ground: '#7fae4c', groundDark: '#67913a' },
  { name: 'The Barnyard', x0: 1200, x1: 2400, skyTop: '#f6b352', skyBottom: '#e2703a', ground: '#a9803f', groundDark: '#8a6629' },
  { name: 'The Kitchen', x0: 2400, x1: 3600, skyTop: '#5a3b2e', skyBottom: '#3a241c', ground: '#8d6e63', groundDark: '#6d4c41' },
];

export function zoneAt(x) {
  for (const zone of ZONES) {
    if (x >= zone.x0 && x < zone.x1) return zone;
  }
  return ZONES[ZONES.length - 1];
}

export function zoneIndexAt(x) {
  for (let i = 0; i < ZONES.length; i += 1) {
    if (x >= ZONES[i].x0 && x < ZONES[i].x1) return i;
  }
  return ZONES.length - 1;
}

// Hay bales: walk into one and the farmer loses sight of the turkey.
export const HAY_BALES = [
  { x: 420, y: 300, w: 120, h: 70 },
  { x: 900, y: 470, w: 130, h: 76 },
  { x: 1500, y: 280, w: 120, h: 70 },
  { x: 2050, y: 500, w: 140, h: 80 },
  { x: 2620, y: 320, w: 110, h: 64 },
  { x: 3150, y: 480, w: 120, h: 70 },
];

// Crates and barrels: solid, they block turkey and farmer alike.
export const CRATES = [
  { x: 640, y: 520, w: 64, h: 64 },
  { x: 1080, y: 240, w: 64, h: 64 },
  { x: 1320, y: 430, w: 70, h: 70 },
  { x: 1780, y: 260, w: 64, h: 64 },
  { x: 2220, y: 380, w: 70, h: 70 },
  { x: 2760, y: 520, w: 64, h: 64 },
  { x: 2980, y: 250, w: 64, h: 64 },
  { x: 3300, y: 420, w: 70, h: 70 },
];

// Kitchen ovens: glowing heat zones. Stand in one too long and a feather goes.
export const OVENS = [
  { x: 2560, y: 240, w: 150, h: 110 },
  { x: 2880, y: 460, w: 160, h: 120 },
  { x: 3220, y: 230, w: 150, h: 110 },
];

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function turkeyHiddenInHay(turkey) {
  for (const bale of HAY_BALES) {
    if (pointInRect(turkey.x, turkey.y, bale)) return true;
  }
  return false;
}

export function ovenAt(px, py) {
  for (const oven of OVENS) {
    if (pointInRect(px, py, oven)) return oven;
  }
  return null;
}

// Push a circle actor out of every crate and keep it inside the world band.
export function collideWithWorld(actor, radius) {
  actor.x = Math.max(radius, Math.min(WORLD_WIDTH - radius, actor.x));
  actor.y = Math.max(WORLD_TOP + radius, Math.min(WORLD_BOTTOM - radius, actor.y));
  for (const crate of CRATES) {
    const nearX = Math.max(crate.x, Math.min(crate.x + crate.w, actor.x));
    const nearY = Math.max(crate.y, Math.min(crate.y + crate.h, actor.y));
    const dx = actor.x - nearX;
    const dy = actor.y - nearY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius) {
      if (distSq === 0) {
        actor.y = crate.y - radius;
        continue;
      }
      const dist = Math.sqrt(distSq);
      actor.x = nearX + (dx / dist) * radius;
      actor.y = nearY + (dy / dist) * radius;
    }
  }
}

export function makePickups(random) {
  const pickups = [];
  const kinds = ['corn', 'corn', 'corn', 'pumpkin', 'corn'];
  for (let i = 0; i < 26; i += 1) {
    pickups.push({
      kind: kinds[i % kinds.length],
      x: 180 + random() * (WORLD_WIDTH - 360),
      y: WORLD_TOP + 40 + random() * (WORLD_BOTTOM - WORLD_TOP - 80),
      taken: false,
      bob: random() * Math.PI * 2,
    });
  }
  pickups.push({ kind: 'golden', x: 1180, y: 240, taken: false, bob: 0 });
  pickups.push({ kind: 'golden', x: 2380, y: 560, taken: false, bob: 1 });
  return pickups;
}

export function distanceToGate(x) {
  return Math.max(0, Math.round((GATE_X - x) / 10));
}
