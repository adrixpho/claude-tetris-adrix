'use strict';

// Menú de pausa. Usa globals de game.js (init, togglePause, paused, gameOver, startLevel).
const pauseMenu = document.getElementById('pause-menu');
const pauseMainView = document.getElementById('pause-main');
const pauseControlsView = document.getElementById('pause-controls-view');
const pauseLevelSelect = document.getElementById('pause-start-level');
const MAX_START_LEVEL = 15;

for (let i = 1; i <= MAX_START_LEVEL; i++) {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = i;
  pauseLevelSelect.appendChild(opt);
}
function showPauseView(controls) {
  pauseMainView.classList.toggle('hidden', controls);
  pauseControlsView.classList.toggle('hidden', !controls);
}

function showPauseMenu() {
  let saved = 1;
  try { saved = parseInt(localStorage.getItem('tetris-start-level'), 10) || 1; } catch (e) { /* ignorar */ }
  pauseLevelSelect.value = Math.min(Math.max(saved, 1), MAX_START_LEVEL);
  pauseMenu.classList.remove('hidden');
  showPauseView(false);
}

function hidePauseMenu() {
  pauseMenu.classList.add('hidden');
  if (document.activeElement && pauseMenu.contains(document.activeElement)) {
    document.activeElement.blur();
  }
}

document.getElementById('pause-resume').addEventListener('click', togglePause);
document.getElementById('pause-restart').addEventListener('click', init);
document.getElementById('pause-controls').addEventListener('click', () => showPauseView(true));
document.getElementById('pause-back').addEventListener('click', () => showPauseView(false));

pauseLevelSelect.addEventListener('change', () => {
  const v = parseInt(pauseLevelSelect.value, 10);
  if (!(v >= 1 && v <= MAX_START_LEVEL)) return;
  // Solo se guarda; init() lo lee al empezar la próxima partida (no altera la actual).
  try { localStorage.setItem('tetris-start-level', String(v)); } catch (e) { /* ignorar */ }
});

// En la vista de controles, Escape vuelve al menú en lugar de reanudar.
window.addEventListener('keydown', e => {
  if (e.code === 'Escape' && paused && !gameOver && !pauseControlsView.classList.contains('hidden')) {
    e.stopImmediatePropagation();
    showPauseView(false);
  }
}, true);
