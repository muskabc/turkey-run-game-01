// Gobble Dash input: keyboard (WASD and arrows, Space or Shift to dash,
// P pause, R restart, Enter confirm) and mouse (hold to steer toward the
// pointer, click to dash). One shared state object the main loop reads.

export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    axisX: 0,
    axisY: 0,
    dashPressed: false,
    pausePressed: false,
    restartPressed: false,
    confirmPressed: false,
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
    clicked: false,
    clickX: 0,
    clickY: 0,
  };

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      if (key === ' ' || key === 'shift') input.dashPressed = true;
      if (key === 'p' || key === 'escape') input.pausePressed = true;
      if (key === 'r') input.restartPressed = true;
      if (key === 'enter') input.confirmPressed = true;
    }
    input.keys.add(key);
  });

  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });

  function pointerPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const pos = pointerPos(event);
    input.pointerDown = true;
    input.pointerX = pos.x;
    input.pointerY = pos.y;
    input.clicked = true;
    input.clickX = pos.x;
    input.clickY = pos.y;
  });
  canvas.addEventListener('pointermove', (event) => {
    const pos = pointerPos(event);
    input.pointerX = pos.x;
    input.pointerY = pos.y;
  });
  window.addEventListener('pointerup', () => {
    input.pointerDown = false;
  });

  return input;
}

export function readAxes(input, turkeyScreenX, turkeyScreenY) {
  let ax = 0;
  let ay = 0;
  if (input.keys.has('a') || input.keys.has('arrowleft')) ax -= 1;
  if (input.keys.has('d') || input.keys.has('arrowright')) ax += 1;
  if (input.keys.has('w') || input.keys.has('arrowup')) ay -= 1;
  if (input.keys.has('s') || input.keys.has('arrowdown')) ay += 1;
  if (ax === 0 && ay === 0 && input.pointerDown) {
    const dx = input.pointerX - turkeyScreenX;
    const dy = input.pointerY - turkeyScreenY;
    const dist = Math.hypot(dx, dy);
    if (dist > 24) {
      ax = dx / dist;
      ay = dy / dist;
    }
  }
  input.axisX = ax;
  input.axisY = ay;
  if (input.clicked) input.dashPressed = true;
}

export function clearOneShots(input) {
  input.dashPressed = false;
  input.pausePressed = false;
  input.restartPressed = false;
  input.confirmPressed = false;
  input.clicked = false;
}
