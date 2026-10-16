'use strict';

// Skins visuales. Se carga después de game.js (comparte scope global).
// Cada skin: { colors, drawBlock(context, x, y, colorIndex, size, alpha), gridColor? }

function skinRoundRectPath(context, x, y, w, h, r) {
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, w, h, r);
    return;
  }
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

const SKINS = {
  retro: {
    colors: COLORS,
    drawBlock(context, x, y, colorIndex, size, alpha) {
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },

  neon: {
    colors: [null, '#00f0ff', '#ffee00', '#d400ff', '#39ff14', '#ff1744', '#2979ff', '#ff9100', '#c0c0c0'],
    gridColor: () => '#1a1a1a',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      const a = alpha ?? 1;
      const px = x * size + 2, py = y * size + 2, s = size - 4;
      context.globalAlpha = a;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.fillStyle = 'rgba(0,0,0,0.85)';
      context.fillRect(px, py, s, s);
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(px, py, s, s);
      context.shadowBlur = 0;
      context.shadowColor = 'transparent';
      context.fillStyle = color;
      context.globalAlpha = a * 0.35;
      context.fillRect(px + 4, py + 4, s - 8, s - 8);
      context.globalAlpha = 1;
    },
  },

  pastel: {
    colors: [null, '#a8e6ef', '#fff1b8', '#d9b8f0', '#b9e8c0', '#f7b8b8', '#bcd8f7', '#fcd5a8', '#d0d0d8'],
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const px = x * size + 1, py = y * size + 1, s = size - 2;
      context.globalAlpha = alpha ?? 1;
      skinRoundRectPath(context, px, py, s, s, 6);
      context.fillStyle = this.colors[colorIndex];
      context.fill();
      skinRoundRectPath(context, px + 0.5, py + 0.5, s - 1, s - 1, 6);
      context.strokeStyle = 'rgba(255,255,255,0.7)';
      context.lineWidth = 1;
      context.stroke();
      context.globalAlpha = 1;
    },
  },

  pixel: {
    colors: [null, '#29b6c5', '#e6b800', '#8e44ad', '#43a047', '#d32f2f', '#3f7fd0', '#e67e22', '#757575'],
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const px = x * size + 1, py = y * size + 1, s = size - 2;
      const t = size >= 24 ? 3 : 2;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      context.fillRect(px, py, s, s);
      // textura determinista de sub-cuadros claros/oscuros
      const n = Math.floor(s / t);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const v = (i * 7 + j * 13 + i * j) % 6;
          if (v === 0) context.fillStyle = 'rgba(255,255,255,0.28)';
          else if (v === 3) context.fillStyle = 'rgba(0,0,0,0.22)';
          else continue;
          context.fillRect(px + i * t, py + j * t, t, t);
        }
      }
      context.strokeStyle = 'rgba(0,0,0,0.55)';
      context.lineWidth = 1;
      context.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
      context.globalAlpha = 1;
    },
  },
};

let activeSkin = SKINS.retro;

function applySkin(name) {
  if (!SKINS[name]) name = 'retro';
  activeSkin = SKINS[name];
  document.body.classList.remove('skin-retro', 'skin-neon', 'skin-pastel', 'skin-pixel');
  document.body.classList.add('skin-' + name);
  const sel = document.getElementById('skin-select');
  if (sel) sel.value = name;
  // redibujo inmediato (también en pausa o game over)
  if (next) drawNext();
  if (current && board) draw();
  return name;
}

(function initSkins() {
  let saved = null;
  try { saved = localStorage.getItem('tetris-skin'); } catch (e) { /* ignorar */ }
  applySkin(saved);
  const sel = document.getElementById('skin-select');
  if (sel) {
    // las teclas de juego no deben cambiar el select nativo
    sel.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
        sel.blur();
      }
    });
    sel.addEventListener('change', () => {
      const name = applySkin(sel.value);
      try { localStorage.setItem('tetris-skin', name); } catch (e) { /* ignorar */ }
      sel.blur(); // evita que las flechas cambien el select durante el juego
    });
  }
})();
