// Gobble Dash HUD and screens: the in-run heads-up display (score, distance
// to freedom, feathers, stamina, zone, farmer alert, progress bar), the
// title screen, pause, and the caught / escaped end screens with restart
// buttons. Buttons are plain rectangles the main loop hit-tests.

import { VIEW_H, VIEW_W, drawFarmer, drawTurkey } from './gobble-art.js';
import { GATE_X, WORLD_WIDTH, distanceToGate, zoneAt } from './gobble-world.js';

export const BUTTONS = {
  play: { x: VIEW_W / 2 - 150, y: 470, w: 300, h: 62, label: 'RUN, TURKEY, RUN!' },
  restart: { x: VIEW_W / 2 - 150, y: 480, w: 300, h: 62, label: 'RUN AGAIN' },
  resume: { x: VIEW_W / 2 - 130, y: 380, w: 260, h: 56, label: 'KEEP RUNNING' },
};

export function buttonHit(button, x, y) {
  return x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h;
}

function panel(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
}

function drawButton(ctx, button, hover) {
  panel(ctx, button.x, button.y, button.w, button.h, hover ? '#ef6c00' : '#e65100');
  ctx.strokeStyle = '#ffcc80';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(button.x, button.y, button.w, button.h, 14);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 8);
}

function featherIcon(ctx, x, y, alive) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = alive ? '#ffb300' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = alive ? '#8a5527' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx, game) {
  const turkey = game.turkey;
  panel(ctx, 14, 12, 430, 96, 'rgba(38,20,8,0.72)');
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score ' + game.score, 30, 44);
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText('Freedom: ' + distanceToGate(turkey.x) + ' m', 30, 72);
  ctx.fillText(zoneAt(turkey.x).name, 240, 72);
  for (let i = 0; i < 5; i += 1) {
    featherIcon(ctx, 238 + i * 24, 38, i < turkey.feathers);
  }
  // Stamina bar.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(30, 84, 180, 12);
  ctx.fillStyle = '#8bc34a';
  ctx.fillRect(30, 84, 180 * turkey.stamina, 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('DASH', 36, 94);
  // Time.
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('Time ' + mins + ':' + String(secs).padStart(2, '0'), 432, 44);
  ctx.textAlign = 'left';

  // Farmer alert banner.
  if (game.farmer.state === 'chase') {
    panel(ctx, VIEW_W / 2 - 190, 12, 380, 46, 'rgba(183,28,28,0.85)');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED! The farmer is coming!', VIEW_W / 2, 42);
  } else if (game.farmer.state === 'search') {
    panel(ctx, VIEW_W / 2 - 170, 12, 340, 42, 'rgba(230,126,34,0.8)');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('He lost you… stay hidden', VIEW_W / 2, 39);
  }

  // Heat warning near ovens.
  if (turkey.heat > 0.05) {
    panel(ctx, VIEW_W / 2 - 150, VIEW_H - 92, 300, 40, 'rgba(183,28,28,0.8)');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOO HOT! Get out of the oven glow!', VIEW_W / 2, VIEW_H - 66);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(VIEW_W / 2 - 130, VIEW_H - 60, 260, 8);
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(VIEW_W / 2 - 130, VIEW_H - 60, 260 * Math.min(1, turkey.heat), 8);
  }

  // Progress bar: turkey, farmer and gate along the whole route.
  const barX = 240;
  const barW = VIEW_W - 480;
  const barY = VIEW_H - 34;
  ctx.fillStyle = 'rgba(38,20,8,0.7)';
  ctx.fillRect(barX, barY, barW, 14);
  ctx.fillStyle = '#7fae4c';
  ctx.fillRect(barX, barY, barW * (1200 / WORLD_WIDTH), 14);
  ctx.fillStyle = '#a9803f';
  ctx.fillRect(barX + barW * (1200 / WORLD_WIDTH), barY, barW * (1200 / WORLD_WIDTH), 14);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(barX + barW * (2400 / WORLD_WIDTH), barY, barW * (1200 / WORLD_WIDTH), 14);
  const turkeyMark = barX + barW * (turkey.x / WORLD_WIDTH);
  const farmerMark = barX + barW * (game.farmer.x / WORLD_WIDTH);
  const gateMark = barX + barW * (GATE_X / WORLD_WIDTH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gateMark - 2, barY - 6, 4, 26);
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.arc(farmerMark, barY + 7, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(turkeyMark, barY + 7, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FARMYARD', barX + barW * 0.17, barY - 8);
  ctx.fillText('BARNYARD', barX + barW * 0.5, barY - 8);
  ctx.fillText('KITCHEN', barX + barW * 0.83, barY - 8);
  ctx.fillText('FREEDOM', gateMark, barY - 8);

  if (game.message && game.messageTime > 0) {
    ctx.fillStyle = 'rgba(255,233,184,' + Math.min(1, game.messageTime).toFixed(2) + ')';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, VIEW_W / 2, 150);
  }
}

export function drawTitleScreen(ctx, game, hover) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#f9d976');
  sky.addColorStop(0.55, '#f39f5a');
  sky.addColorStop(1, '#7fae4c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(38,20,8,0.55)';
  ctx.fillRect(0, 0, VIEW_W, 250);

  ctx.fillStyle = '#fff8e1';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('GOBBLE DASH', VIEW_W / 2, 96);
  ctx.font = 'italic bold 28px Georgia, serif';
  ctx.fillStyle = '#ffcc80';
  ctx.fillText('The Great Thanksgiving Escape', VIEW_W / 2, 140);
  ctx.font = '19px Georgia, serif';
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText('You are the turkey. Dinner is at six. The farmer has a carving knife and the oven is preheating.', VIEW_W / 2, 182);
  ctx.fillText('Run the farmyard, the barnyard and the kitchen. Hide in hay, dodge knives, stay out of the oven glow, reach FREEDOM.', VIEW_W / 2, 210);

  // Cast portrait row: turkey, farmer with knife, oven.
  const demoTurkey = { x: 0, y: 0, facing: 1, runPhase: game.time * 8, dashTime: 0, invulnerable: 0, hidden: false };
  ctx.save();
  ctx.translate(330, 350);
  ctx.scale(1.7, 1.7);
  drawTurkey(ctx, demoTurkey, 0);
  ctx.restore();
  ctx.fillStyle = '#3e2723';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('YOU — the turkey', 330, 440);

  const demoFarmer = { x: 0, y: 0, facing: -1, runPhase: game.time * 7, state: 'patrol' };
  ctx.save();
  ctx.translate(640, 340);
  ctx.scale(1.5, 1.5);
  drawFarmer(ctx, demoFarmer, 0);
  ctx.restore();
  ctx.fillText('THE FARMER — with knife!', 640, 440);

  ctx.save();
  ctx.translate(950, 300);
  ctx.fillStyle = '#37474f';
  ctx.beginPath();
  ctx.roundRect(-70, 0, 140, 100, 10);
  ctx.fill();
  ctx.fillStyle = '#1c262b';
  ctx.beginPath();
  ctx.roundRect(-54, 16, 108, 62, 8);
  ctx.fill();
  ctx.fillStyle = '#ff8a3c';
  ctx.beginPath();
  ctx.moveTo(-30, 74);
  ctx.quadraticCurveTo(0, 20, 30, 74);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillText('THE OVEN — preheated!', 950, 440);

  panel(ctx, VIEW_W / 2 - 430, 548, 860, 118, 'rgba(38,20,8,0.66)');
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Move: WASD / arrow keys / hold the mouse    Dash: Space, Shift or click    Pause: P    Restart: R', VIEW_W / 2, 582);
  ctx.fillText('Corn +50 and dash energy · Pumpkin +150 · Golden corn +1 feather · Hay hides you · 3 feathers, then dinner', VIEW_W / 2, 612);
  ctx.fillText('Click RUN or press Enter to start. Gobble gobble!', VIEW_W / 2, 642);

  drawButton(ctx, BUTTONS.play, hover);
}

export function drawEndScreen(ctx, game, hover) {
  ctx.fillStyle = game.escaped ? 'rgba(27,60,20,0.72)' : 'rgba(60,16,10,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (game.escaped) {
    ctx.fillStyle = '#c8e6c9';
    ctx.font = 'bold 58px Georgia, serif';
    ctx.fillText('YOU ESCAPED!', VIEW_W / 2, 200);
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillStyle = '#ffe9b8';
    ctx.fillText('The turkey lives to gobble another day. Thanksgiving is cancelled (for you).', VIEW_W / 2, 248);
  } else {
    ctx.fillStyle = '#ffccbc';
    ctx.font = 'bold 58px Georgia, serif';
    ctx.fillText('CAUGHT!', VIEW_W / 2, 200);
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillStyle = '#ffe9b8';
    ctx.fillText('The farmer got his dinner. The oven sighs with relief. So close!', VIEW_W / 2, 248);
  }
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  panel(ctx, VIEW_W / 2 - 260, 300, 520, 150, 'rgba(38,20,8,0.8)');
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Score: ' + game.score, VIEW_W / 2, 348);
  ctx.font = '21px Georgia, serif';
  ctx.fillText('Time: ' + mins + ':' + String(secs).padStart(2, '0') + '   ·   Corn eaten: ' + game.cornEaten, VIEW_W / 2, 388);
  ctx.fillText('Distance run: ' + Math.round(game.turkey.x / 10) + ' m of ' + Math.round(GATE_X / 10) + ' m', VIEW_W / 2, 422);
  drawButton(ctx, BUTTONS.restart, hover);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('or press R to run again', VIEW_W / 2, 580);
}

export function drawPauseScreen(ctx, hover) {
  ctx.fillStyle = 'rgba(20,10,4,0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED — catching your breath', VIEW_W / 2, 300);
  ctx.font = '19px Georgia, serif';
  ctx.fillText('The farmer is also taking a breather. Probably.', VIEW_W / 2, 342);
  drawButton(ctx, BUTTONS.resume, hover);
}
