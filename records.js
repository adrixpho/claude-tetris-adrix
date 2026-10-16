'use strict';

// Tabla de records local (localStorage). Depende de game.js: score, lines, level, maxCombo, init, gameOver.

const RECORDS_KEY = 'tetris-records';
const MAX_RECORDS = 5;

const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const startRecordsEl = document.getElementById('start-records');
const goRecordsEl = document.getElementById('go-records');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');

let pendingEntry = null; // { score, lines, level } de la partida terminada, a la espera de nombre
let highlightIndex = -1;

function loadRecords() {
  const empty = { top: [], bestCombo: 0, maxLines: 0 };
  try {
    const data = JSON.parse(localStorage.getItem(RECORDS_KEY));
    if (!data || !Array.isArray(data.top)) return empty;
    const top = data.top
      .filter(r => r && typeof r === 'object' && Number.isFinite(Number(r.score)))
      .map(r => ({
        name: String(r.name ?? '').slice(0, 12) || 'Anónimo',
        score: Number(r.score),
        lines: Number(r.lines) || 0,
        level: Number(r.level) || 1,
        date: String(r.date ?? ''),
      }))
      .sort((a, b) => b.score - a.score);
    return {
      top: top.slice(0, MAX_RECORDS),
      bestCombo: Number(data.bestCombo) || 0,
      maxLines: Number(data.maxLines) || 0,
    };
  } catch (err) {
    return empty;
  }
}

function saveRecords(data) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(data));
  } catch (err) {
    // almacenamiento no disponible: se ignora
  }
}

function qualifiesForTop(data, pts) {
  if (pts <= 0) return false;
  return data.top.length < MAX_RECORDS || pts > data.top[data.top.length - 1].score;
}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderRecords(container, hlIndex) {
  const data = loadRecords();
  container.textContent = '';
  container.appendChild(el('p', 'RECORDS', 'records-title'));

  const table = el('table', undefined, 'records-table');
  const head = el('tr');
  ['#', 'Nombre', 'Puntos', 'Líneas', 'Nivel', 'Fecha'].forEach(h => head.appendChild(el('th', h)));
  table.appendChild(head);

  if (data.top.length === 0) {
    const row = el('tr');
    const cell = el('td', 'Sin records todavía', 'records-empty');
    cell.colSpan = 6;
    row.appendChild(cell);
    table.appendChild(row);
  }
  data.top.forEach((rec, i) => {
    const row = el('tr', undefined, i === hlIndex ? 'record-highlight' : '');
    row.appendChild(el('td', String(i + 1)));
    row.appendChild(el('td', rec.name));
    row.appendChild(el('td', Number(rec.score).toLocaleString()));
    row.appendChild(el('td', String(rec.lines)));
    row.appendChild(el('td', String(rec.level)));
    row.appendChild(el('td', rec.date));
    table.appendChild(row);
  });
  container.appendChild(table);

  container.appendChild(el('p', `Mejor combo: ${data.bestCombo} · Líneas máx.: ${data.maxLines}`, 'records-stats'));

  const reset = el('button', 'Resetear records', 'records-reset');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    if (!confirm('¿Borrar todos los records?')) return;
    try {
      localStorage.removeItem(RECORDS_KEY);
    } catch (err) {
      // ignorar
    }
    pendingEntry = null;
    nameForm.classList.add('hidden');
    renderAllRecords(-1);
  });
  container.appendChild(reset);
}

function renderAllRecords(hlIndex) {
  renderRecords(startRecordsEl, -1);
  renderRecords(goRecordsEl, hlIndex);
}

// Hook invocado por endGame() en game.js
function onGameOver() {
  const data = loadRecords();
  if (maxCombo > data.bestCombo) data.bestCombo = maxCombo;
  if (lines > data.maxLines) data.maxLines = lines;
  saveRecords(data);

  pendingEntry = qualifiesForTop(data, score) ? { score, lines, level } : null;
  highlightIndex = -1;
  renderAllRecords(-1);
  goRecordsEl.classList.remove('hidden');
  if (pendingEntry) {
    nameForm.classList.remove('hidden');
    nameInput.value = '';
    // retraso para que teclas aún pulsadas (Espacio, flechas) no caigan en el input
    setTimeout(() => { if (pendingEntry) nameInput.focus(); }, 600);
  } else {
    nameForm.classList.add('hidden');
  }
}

// Guarda la partida pendiente con el nombre escrito; devuelve el índice en el top
function commitPending() {
  if (!pendingEntry) return -1;
  const data = loadRecords();
  const entry = {
    name: nameInput.value.trim().slice(0, 12) || 'Anónimo',
    score: pendingEntry.score,
    lines: pendingEntry.lines,
    level: pendingEntry.level,
    date: new Date().toLocaleDateString('es-ES'),
  };
  // en empate, la entrada nueva queda detrás de las existentes
  let idx = data.top.findIndex(r => entry.score > r.score);
  if (idx === -1) idx = data.top.length;
  data.top.splice(idx, 0, entry);
  data.top = data.top.slice(0, MAX_RECORDS);
  saveRecords(data);
  pendingEntry = null;
  nameForm.classList.add('hidden');
  return idx < MAX_RECORDS ? idx : -1;
}

nameForm.addEventListener('submit', e => {
  e.preventDefault();
  renderAllRecords(commitPending());
  restartBtn.focus();
});

function startGame() {
  startOverlay.classList.add('hidden');
  startBtn.blur();
  init();
}

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', e => {
  const onStart = e.target === document.body || e.target === startBtn;
  if (e.code === 'Enter' && onStart && !startOverlay.classList.contains('hidden')) {
    e.preventDefault();
    startGame();
  }
});

// Al reiniciar se oculta la tabla del overlay (el overlay se reutiliza para otros estados)
restartBtn.addEventListener('click', () => {
  commitPending(); // no perder la puntuación si se reinicia sin pulsar "Guardar"
  nameForm.classList.add('hidden');
  goRecordsEl.classList.add('hidden');
});

renderAllRecords(-1);
startBtn.focus();
