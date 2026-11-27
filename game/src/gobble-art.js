// Gobble Dash art: every sprite is drawn with canvas paths at run time, no
// image files. A round brown turkey with a fan tail, a farmer in overalls
// with a carving knife, glowing ovens, hay bales, corn and the Freedom Gate,
// all in one autumn palette.

import { CRATES, GATE_X, HAY_BALES, OVENS, WORLD_BOTTOM, WORLD_TOP, WORLD_WIDTH, ZONES, zoneAt } from './gobble-world.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export function drawBackdrop(ctx, cameraX, time) {
  const zone = zoneAt(cameraX + VIEW_W / 2);
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, zone.skyTop);
  sky.addColorStop(1, zone.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Low sun and drifting autumn leaves behind everything.
  ellipse(ctx, 1080 - (cameraX * 0.1) % 300, 92, 46, 46, '#fff3b0');
  ellipse(ctx, 1080 - (cameraX * 0.1) % 300, 92, 60, 60, 'rgba(255,243,176,0.25)');
  ctx.fillStyle = 'rgba(214,120,40,0.5)';
  for (let i = 0; i < 14; i += 1) {
    const lx = ((i * 173 + time * 24) % (VIEW_W + 40)) - 20;
    const ly = 60 + ((i * 97 + time * 16) % 200);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(time * 1.5 + i);
    ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();
  }

  // Distant barn and fence line, parallax slow.
  const barnX = 260 - (cameraX * 0.35) % 1400;
  roundRect(ctx, barnX, 150, 190, 120, 4, '#9c3b2e');
  ctx.fillStyle = '#6e2a20';
  ctx.beginPath();
  ctx.moveTo(barnX - 12, 152);
  ctx.lineTo(barnX + 95, 104);
  ctx.lineTo(barnX + 202, 152);
  ctx.closePath();
  ctx.fill();
  roundRect(ctx, barnX + 70, 200, 52, 70, 3, '#5d241b');
  ctx.strokeStyle = 'rgba(90,50,20,0.55)';
  ctx.lineWidth = 5;
  for (let fx = -((cameraX * 0.5) % 90); fx < VIEW_W; fx += 90) {
    ctx.beginPath();
    ctx.moveTo(fx, 252);
    ctx.lineTo(fx, 292);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 264);
  ctx.lineTo(VIEW_W, 264);
  ctx.stroke();

  // Ground band with zone tint and a worn dirt path.
  ctx.fillStyle = zone.ground;
  ctx.fillRect(0, WORLD_TOP, VIEW_W, VIEW_H - WORLD_TOP);
  ctx.fillStyle = zone.groundDark;
  ctx.fillRect(0, WORLD_BOTTOM, VIEW_W, VIEW_H - WORLD_BOTTOM);
  ctx.fillStyle = 'rgba(120,84,40,0.35)';
  ctx.fillRect(0, 400, VIEW_W, 90);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let gx = -((cameraX) % 64); gx < VIEW_W; gx += 64) {
    ctx.fillRect(gx, WORLD_TOP + 18, 30, 5);
    ctx.fillRect(gx + 20, WORLD_BOTTOM - 26, 30, 5);
  }
}

export function drawZoneSigns(ctx, cameraX) {
  for (const zone of ZONES) {
    const sx = zone.x0 + 60 - cameraX;
    if (sx < -260 || sx > VIEW_W + 40) continue;
    roundRect(ctx, sx, WORLD_TOP - 64, 210, 44, 8, '#5d3a1a');
    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 21px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(zone.name, sx + 105, WORLD_TOP - 35);
    ctx.fillStyle = '#4a2c10';
    ctx.fillRect(sx + 96, WORLD_TOP - 20, 18, 22);
  }
}

export function drawHayBales(ctx, cameraX) {
  for (const bale of HAY_BALES) {
    const sx = bale.x - cameraX;
    if (sx < -180 || sx > VIEW_W + 40) continue;
    roundRect(ctx, sx, bale.y, bale.w, bale.h, 16, '#e8b64c');
    ctx.strokeStyle = '#b9822e';
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(sx + (bale.w / 4) * i, bale.y + 6);
      ctx.lineTo(sx + (bale.w / 4) * i, bale.y + bale.h - 6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,230,150,0.7)';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDE', sx + bale.w / 2, bale.y + bale.h / 2 + 5);
  }
}

export function drawCrates(ctx, cameraX) {
  for (const crate of CRATES) {
    const sx = crate.x - cameraX;
    if (sx < -120 || sx > VIEW_W + 40) continue;
    roundRect(ctx, sx, crate.y, crate.w, crate.h, 4, '#8a5a2b');
    ctx.strokeStyle = '#5f3c18';
    ctx.lineWidth = 4;
    ctx.strokeRect(sx + 4, crate.y + 4, crate.w - 8, crate.h - 8);
    ctx.beginPath();
    ctx.moveTo(sx + 4, crate.y + 4);
    ctx.lineTo(sx + crate.w - 4, crate.y + crate.h - 4);
    ctx.moveTo(sx + crate.w - 4, crate.y + 4);
    ctx.lineTo(sx + 4, crate.y + crate.h - 4);
    ctx.stroke();
  }
}

export function drawOvens(ctx, cameraX, time) {
  for (const oven of OVENS) {
    const sx = oven.x - cameraX;
    if (sx < -220 || sx > VIEW_W + 40) continue;
    const flicker = 0.75 + Math.sin(time * 9 + oven.x) * 0.25;
    const glow = ctx.createRadialGradient(sx + oven.w / 2, oven.y + oven.h / 2, 10, sx + oven.w / 2, oven.y + oven.h / 2, oven.w);
    glow.addColorStop(0, 'rgba(255,120,30,' + (0.5 * flicker).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 40, oven.y - 40, oven.w + 80, oven.h + 80);
    roundRect(ctx, sx, oven.y, oven.w, oven.h, 10, '#37474f');
    roundRect(ctx, sx + 14, oven.y + 18, oven.w - 28, oven.h - 48, 8, '#1c262b');
    ctx.fillStyle = 'rgba(255,' + Math.round(120 + 60 * flicker) + ',40,0.95)';
    ctx.beginPath();
    const cx = sx + oven.w / 2;
    const baseY = oven.y + oven.h - 34;
    ctx.moveTo(cx - 34, baseY);
    ctx.quadraticCurveTo(cx - 10, baseY - 44 * flicker, cx, baseY - 8);
    ctx.quadraticCurveTo(cx + 12, baseY - 38 * flicker, cx + 34, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffcc80';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('OVEN — HOT!', cx, oven.y + 16);
    ctx.fillStyle = '#90a4ae';
    for (let i = 0; i < 3; i += 1) ellipse(ctx, sx + 26 + i * 22, oven.y + oven.h - 12, 5, 5, '#90a4ae');
  }
}

export function drawGate(ctx, cameraX, time) {
  const sx = GATE_X - cameraX;
  if (sx < -260 || sx > VIEW_W + 60) return;
  const pulse = 0.6 + Math.sin(time * 3) * 0.2;
  ctx.fillStyle = 'rgba(255,240,170,' + pulse.toFixed(3) + ')';
  ctx.fillRect(sx - 8, WORLD_TOP - 10, 120, WORLD_BOTTOM - WORLD_TOP + 20);
  ctx.fillStyle = '#6d4c1f';
  ctx.fillRect(sx, WORLD_TOP - 30, 16, WORLD_BOTTOM - WORLD_TOP + 40);
  ctx.fillRect(sx + 88, WORLD_TOP - 30, 16, WORLD_BOTTOM - WORLD_TOP + 40);
  roundRect(ctx, sx - 14, WORLD_TOP - 74, 132, 42, 8, '#2e7d32');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM', sx + 52, WORLD_TOP - 46);
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('no dinner here', sx + 52, WORLD_TOP - 30);
}

export function drawPickup(ctx, pickup, cameraX, time) {
  if (pickup.taken) return;
  const sx = pickup.x - cameraX;
  if (sx < -60 || sx > VIEW_W + 40) return;
  const bobY = Math.sin(time * 3 + pickup.bob) * 4;
  const y = pickup.y + bobY;
  if (pickup.kind === 'corn') {
    ellipse(ctx, sx, y, 9, 16, '#ffd54f');
    ctx.strokeStyle = '#c49002';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 6, y - 8);
    ctx.lineTo(sx + 6, y - 8);
    ctx.moveTo(sx - 7, y);
    ctx.lineTo(sx + 7, y);
    ctx.moveTo(sx - 6, y + 8);
    ctx.lineTo(sx + 6, y + 8);
    ctx.stroke();
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.moveTo(sx - 8, y + 12);
    ctx.quadraticCurveTo(sx - 16, y + 22, sx - 4, y + 24);
    ctx.quadraticCurveTo(sx + 8, y + 24, sx + 10, y + 12);
    ctx.closePath();
    ctx.fill();
  } else if (pickup.kind === 'pumpkin') {
    ellipse(ctx, sx, y, 16, 13, '#ef6c00');
    ellipse(ctx, sx - 7, y, 8, 12, '#f57c00');
    ellipse(ctx, sx + 7, y, 8, 12, '#f57c00');
    ctx.fillStyle = '#33691e';
    ctx.fillRect(sx - 2, y - 18, 5, 7);
  } else {
    ellipse(ctx, sx, y, 11, 19, '#ffecb3');
    ellipse(ctx, sx, y, 15, 23, 'rgba(255,213,79,0.35)');
    ctx.fillStyle = '#ffb300';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('+1 feather', sx, y - 28);
  }
}

export function drawTurkey(ctx, turkey, cameraX) {
  const sx = turkey.x - cameraX;
  const sy = turkey.y;
  const f = turkey.facing >= 0 ? 1 : -1;
  const blink = turkey.invulnerable > 0 && Math.floor(turkey.invulnerable * 12) % 2 === 0;
  ctx.save();
  ctx.translate(sx, sy);
  if (blink) ctx.globalAlpha = 0.45;
  // Fan tail behind the body.
  ctx.fillStyle = '#8d5a2b';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(-f * 18, -6);
    ctx.rotate(i * 0.32 * f);
    ctx.beginPath();
    ctx.ellipse(-f * 16, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body, wing and head.
  ellipse(ctx, 0, 0, 26, 21, '#a9713a');
  ellipse(ctx, -f * 4, 2, 16, 12, '#8a5527');
  ellipse(ctx, f * 20, -14, 11, 10, '#b9834a');
  // Beak, wattle, eye.
  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.moveTo(f * 29, -15);
  ctx.lineTo(f * 40, -11);
  ctx.lineTo(f * 29, -8);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, f * 24, -3, 4, 7, '#d32f2f');
  ellipse(ctx, f * 23, -17, 3, 3, '#1a1a1a');
  // Running legs.
  const legSwing = Math.sin(turkey.runPhase) * 8;
  ctx.strokeStyle = '#e65100';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, 18);
  ctx.lineTo(-6 + legSwing, 30);
  ctx.moveTo(8, 18);
  ctx.lineTo(8 - legSwing, 30);
  ctx.stroke();
  if (turkey.dashTime > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-f * 30, -6);
    ctx.lineTo(-f * 52, -6);
    ctx.moveTo(-f * 28, 4);
    ctx.lineTo(-f * 46, 4);
    ctx.stroke();
  }
  ctx.restore();
  if (turkey.hidden) {
    ctx.fillStyle = 'rgba(46,125,50,0.9)';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('hidden!', sx, sy - 44);
  }
}

export function drawFarmer(ctx, farmer, cameraX) {
  const sx = farmer.x - cameraX;
  const sy = farmer.y;
  const f = farmer.facing >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(sx, sy);
  // Legs in boots, overalls, shirt, head with hat.
  const legSwing = Math.sin(farmer.runPhase) * 7;
  ctx.fillStyle = '#37474f';
  ctx.fillRect(-12 + legSwing * 0.4, 8, 9, 24);
  ctx.fillRect(3 - legSwing * 0.4, 8, 9, 24);
  ctx.fillStyle = '#263238';
  ctx.fillRect(-14 + legSwing * 0.4, 30, 13, 6);
  ctx.fillRect(2 - legSwing * 0.4, 30, 13, 6);
  roundRect(ctx, -15, -22, 30, 34, 5, '#1565c0');
  roundRect(ctx, -15, -22, 30, 12, 5, '#c62828');
  ellipse(ctx, 0, -34, 12, 12, '#ffcc9e');
  ctx.fillStyle = '#f9a825';
  ctx.fillRect(-17, -44, 34, 6);
  ctx.fillRect(-9, -54, 18, 11);
  ellipse(ctx, f * 5, -35, 2.4, 2.4, '#1a1a1a');
  // Arm holding the carving knife forward.
  ctx.strokeStyle = '#c62828';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(f * 12, -16);
  ctx.lineTo(f * 26, -6);
  ctx.stroke();
  ctx.save();
  ctx.translate(f * 30, -6);
  ctx.rotate(f * 0.5);
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(26, 0);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(-9, -2, 9, 5);
  ctx.restore();
  ctx.restore();
  if (farmer.state === 'chase') {
    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', sx, sy - 66);
  } else if (farmer.state === 'search') {
    ctx.fillStyle = '#f9a825';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', sx, sy - 66);
  }
}

export function drawKnife(ctx, knife, cameraX) {
  const sx = knife.x - cameraX;
  ctx.save();
  ctx.translate(sx, knife.y);
  ctx.rotate(knife.spin);
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.lineTo(18, 0);
  ctx.lineTo(-4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(-13, -2, 9, 5);
  ctx.restore();
}

export function worldToScreenX(worldX, cameraX) {
  return worldX - cameraX;
}

export function clampCamera(turkeyX) {
  return Math.max(0, Math.min(WORLD_WIDTH - VIEW_W, turkeyX - VIEW_W / 2));
}
