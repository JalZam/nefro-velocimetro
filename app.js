/* ============================================================
   NEFRO-VELOCÍMETRO — Lógica principal
   Velocímetro de TFG según estadios KDIGO 2024
   ============================================================ */

// ── Estadios KDIGO (GFR mL/min/1.73 m²) ──────────────────────
// El velocímetro va de 0 (izq) a 120 (der)
// Mapeo: valor TFG clamped a [0, 120] → posición angular
const STAGES = [
  {
    key: "G5",
    label: "Estadio 5",
    shortLabel: "G5",
    range: "< 15",
    min: 0,
    max: 15,
    color: "#dc2626",        // rojo intenso
    name: "Falla Renal",
    description: "Función renal muy severamente reducida. Puede requerir diálisis o trasplante renal.",
    tailwindClass: "stage-5"
  },
  {
    key: "G4",
    label: "Estadio 4",
    shortLabel: "G4",
    range: "15 – 29",
    min: 15,
    max: 30,
    color: "#f97316",        // naranja oscuro
    name: "Severamente Disminuida",
    description: "Función renal severamente reducida. Es importante prepararse para terapia de reemplazo renal.",
    tailwindClass: "stage-4"
  },
  {
    key: "G3b",
    label: "Estadio 3b",
    shortLabel: "G3b",
    range: "30 – 44",
    min: 30,
    max: 45,
    color: "#f59e0b",        // ámbar
    name: "Moderada a Severamente Disminuida",
    description: "Función renal moderada a severamente reducida. Seguimiento estrecho y manejo de complicaciones.",
    tailwindClass: "stage-3b"
  },
  {
    key: "G3a",
    label: "Estadio 3a",
    shortLabel: "G3a",
    range: "45 – 59",
    min: 45,
    max: 60,
    color: "#eab308",        // amarillo
    name: "Leve a Moderadamente Disminuida",
    description: "Función renal levemente a moderadamente reducida. Control frecuente de factores de riesgo.",
    tailwindClass: "stage-3a"
  },
  {
    key: "G2",
    label: "Estadio 2",
    shortLabel: "G2",
    range: "60 – 89",
    min: 60,
    max: 90,
    color: "#84cc16",        // verde-lima
    name: "Levemente Disminuida",
    description: "Función renal levemente reducida. Con marcadores de daño renal (ej. albuminuria).",
    tailwindClass: "stage-2"
  },
  {
    key: "G1",
    label: "Estadio 1",
    shortLabel: "G1",
    range: "≥ 90",
    min: 90,
    max: 120,
    color: "#22c55e",        // verde
    name: "Normal o Alta",
    description: "Función renal normal o alta. Con marcadores de daño renal (ej. albuminuria).",
    tailwindClass: "stage-1"
  }
];

// ── Canvas y constantes del velocímetro ──────────────────────
const MAX_GFR = 120;
const MIN_GFR = 0;

// Semicírculo perfecto de 180°:
// 180° (izquierda) → 270° (arriba/12 en punto) → 360° (derecha)
// En canvas: y crece hacia abajo → 270° apunta ARRIBA visualmente ✓
// Base horizontal: la línea del diámetro queda perfectamente horizontal
const START_DEG = 180;  // izquierda = G5 (TFG 0)
const ARC_SPAN  = 180;  // 180° totales → semicírculo

function degToRad(d) { return (d * Math.PI) / 180; }

// TFG 0   → 180° (izquierda) = FALLA RENAL
// TFG 60  → 270° (arriba)    = punto medio
// TFG 120 → 360° (derecha)   = NORMAL
function gfrToAngle(gfr) {
  const v    = Math.max(MIN_GFR, Math.min(MAX_GFR, gfr));
  const frac = (v - MIN_GFR) / (MAX_GFR - MIN_GFR);
  return degToRad(START_DEG + frac * ARC_SPAN); // 180° → 360°
}

// ── Dibujo del velocímetro ────────────────────────────────────
function drawSpeedometer(gfr = null) {
  const canvas = document.getElementById('speedometer');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // ── Geometría del semicírculo ────────────────────────────────
  // El hub (pivot de la aguja) se ubica en el centro horizontal
  // y cerca del borde inferior, dejando espacio abajo para el valor.
  const cx = W / 2;
  const cy = H - 85;   // punto central del diámetro (base horizontal)

  // Radio: limitado para que los ticks y etiquetas quepan
  // – horizontalmente: dejar ~70px a cada lado
  // – verticalmente:   dejar ~42px arriba para la etiqueta superior
  const maxRh = cx - 68;
  const maxRv = cy - 42;
  const R = Math.min(maxRh, maxRv);

  // Arco: de 180° (izquierda) a 360° (derecha), sentido horario en canvas
  // En canvas el eje Y apunta ABAJO, por lo que 270° apunta ARRIBA visualmente.
  // anticlockwise = false → horario: 180°→270°(arriba)→360° ✓ semicírculo superior
  const startRad = degToRad(180);
  const endRad   = degToRad(360);

  // ── 1. Línea base horizontal (el diámetro) ───────────────────
  ctx.beginPath();
  ctx.moveTo(cx - R - 2, cy);
  ctx.lineTo(cx + R + 2, cy);
  ctx.strokeStyle = 'rgba(100,116,139,0.18)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // ── 2. Arco de fondo (pista gris) ───────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, R, startRad, endRad, false);
  ctx.lineWidth   = 44;
  ctx.strokeStyle = 'rgba(100,116,139,0.07)';
  ctx.lineCap     = 'round';
  ctx.stroke();

  // ── 3. Segmentos de estadios coloreados ──────────────────────
  STAGES.forEach(stage => {
    const sMin = Math.max(stage.min, MIN_GFR);
    const sMax = Math.min(stage.max, MAX_GFR);
    const aS   = gfrToAngle(sMin);
    const aE   = gfrToAngle(sMax);

    ctx.beginPath();
    ctx.arc(cx, cy, R, aS, aE, false);
    ctx.lineWidth   = 40;
    ctx.strokeStyle = stage.color;
    ctx.lineCap     = 'butt';
    ctx.globalAlpha = 0.78;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // ── 4. Marcas mayores y etiquetas numéricas ──────────────────
  const tickValues  = [0, 15, 30, 45, 60, 90, 120];
  const lblMap      = { 0:'0', 15:'15', 30:'30', 45:'45', 60:'60', 90:'90', 120:'120' };

  tickValues.forEach(val => {
    const angle = gfrToAngle(val);
    const cosA  = Math.cos(angle);
    const sinA  = Math.sin(angle);

    // Tick
    ctx.beginPath();
    ctx.moveTo(cx + cosA * (R + 5),  cy + sinA * (R + 5));
    ctx.lineTo(cx + cosA * (R + 22), cy + sinA * (R + 22));
    ctx.strokeStyle = 'rgba(71,85,105,0.5)';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Etiqueta
    const lblR = R + 36;
    ctx.fillStyle    = '#334155';
    ctx.font         = 'bold 12px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lblMap[val], cx + cosA * lblR, cy + sinA * lblR);
  });

  // Marcas menores cada 5 unidades
  for (let v = 0; v <= MAX_GFR; v += 5) {
    if (tickValues.includes(v)) continue;
    const angle = gfrToAngle(v);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (R + 3),  cy + Math.sin(angle) * (R + 3));
    ctx.lineTo(cx + Math.cos(angle) * (R + 13), cy + Math.sin(angle) * (R + 13));
    ctx.strokeStyle = 'rgba(71,85,105,0.18)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  // ── 5. Etiquetas de estadio dentro del arco ──────────────────
  const midR = R - 58;
  STAGES.forEach(stage => {
    const midVal = (stage.min + Math.min(stage.max, MAX_GFR)) / 2;
    const angle  = gfrToAngle(midVal);
    const lx = cx + Math.cos(angle) * midR;
    const ly = cy + Math.sin(angle) * midR;

    ctx.save();
    ctx.translate(lx, ly);
    // Rotar perpendicular al radio → texto sigue la curvatura del arco
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle    = stage.color;
    ctx.font         = 'bold 11px Outfit, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.shortLabel, 0, 0);
    ctx.restore();
  });

  // ── 6. Aguja ─────────────────────────────────────────────────
  if (gfr !== null) {
    const needleAngle = gfrToAngle(gfr);
    const stage       = getStage(gfr);
    const needleColor = stage ? stage.color : '#38bdf8';
    const needleLen   = R - 12;
    const needleTail  = 26;

    const nx = Math.cos(needleAngle);
    const ny = Math.sin(needleAngle);

    ctx.save();
    ctx.shadowColor = needleColor;
    ctx.shadowBlur  = 22;

    const perpX = -ny * 4;
    const perpY =  nx * 4;
    ctx.beginPath();
    ctx.moveTo(cx + nx * needleLen,           cy + ny * needleLen);
    ctx.lineTo(cx - nx * needleTail + perpX,  cy - ny * needleTail + perpY);
    ctx.lineTo(cx - nx * needleTail - perpX,  cy - ny * needleTail - perpY);
    ctx.closePath();
    ctx.fillStyle = needleColor;
    ctx.fill();
    ctx.restore();

    // Hub
    const hubGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
    hubGrad.addColorStop(0,   '#ffffff');
    hubGrad.addColorStop(0.4, needleColor);
    hubGrad.addColorStop(1,   'rgba(0,0,0,0.6)');
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // ── 7. Valor TFG debajo del hub ───────────────────────────────
  const valueY = cy + 36;
  if (gfr !== null) {
    ctx.fillStyle    = '#1e293b';
    ctx.font         = 'bold 42px Outfit, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(gfr), cx, valueY);

    ctx.fillStyle = 'rgba(71,85,105,0.85)';
    ctx.font      = '12px Inter, sans-serif';
    ctx.fillText('mL/min/1.73 m²', cx, valueY + 30);
  } else {
    ctx.fillStyle    = 'rgba(100,116,139,0.5)';
    ctx.font         = '14px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ingresa tu TFG para ver el resultado', cx, valueY + 14);
  }

  // ── 8. Etiquetas de extremos (debajo de los extremos del diámetro) ──
  // Izquierda: FALLA RENAL
  ctx.fillStyle    = 'rgba(220,38,38,0.92)';
  ctx.font         = 'bold 9.5px Inter, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FALLA', cx - R, cy + 8);
  ctx.fillText('RENAL', cx - R, cy + 20);

  // Derecha: NORMAL / ALTA
  ctx.fillStyle = 'rgba(34,197,94,0.92)';
  ctx.fillText('NORMAL', cx + R, cy + 8);
  ctx.fillText('/ ALTA',  cx + R, cy + 20);
}

// ── Obtener estadio por valor de GFR ─────────────────────────
function getStage(gfr) {
  for (const s of STAGES) {
    if (gfr >= s.min && gfr < s.max) return s;
  }
  // G1 incluye exactamente 120
  if (gfr >= 90) return STAGES[5];
  // G5 incluye 0
  if (gfr < 15)  return STAGES[0];
  return null;
}

// ── Actualizar panel de resultado ────────────────────────────
function updateResultPanel(gfr) {
  const panel = document.getElementById('result-panel');
  const badge = document.getElementById('stage-badge');
  const name  = document.getElementById('stage-name');
  const desc  = document.getElementById('stage-desc');

  const stage = getStage(gfr);
  if (!stage) { panel.classList.add('hidden'); return; }

  badge.textContent = stage.shortLabel;
  badge.style.color = stage.color;

  name.textContent = `${stage.label} — ${stage.name}`;
  name.style.color = stage.color;

  desc.innerHTML = `<strong>TFG: ${Math.round(gfr)} mL/min/1.73 m²</strong> &nbsp;·&nbsp; Rango: ${stage.range} mL/min/1.73 m²<br>${stage.description}`;

  panel.classList.remove('hidden');
  panel.style.borderColor = stage.color + '55';
}

// ── Resaltar tarjeta de estadio activa ───────────────────────
function highlightStageCard(gfr) {
  document.querySelectorAll('.stage-card').forEach(card => {
    card.classList.remove('active');
  });
  const stage = getStage(gfr);
  if (!stage) return;
  const card = document.getElementById(`card-${stage.key}`);
  if (card) {
    card.classList.add('active');
    card.style.setProperty('--active-color', stage.color);
  }
}

// ── Función principal de cálculo ─────────────────────────────
function calcular() {
  const input = document.getElementById('gfr-input');
  const raw   = input.value.trim();
  if (raw === '' || isNaN(parseFloat(raw))) {
    shakeInput(input);
    return;
  }
  const gfr = Math.max(0, Math.min(200, parseFloat(raw)));
  const gfrClamped = Math.min(gfr, 120); // clamp for gauge

  animateNeedle(lastGfr, gfrClamped, 800);
  lastGfr = gfrClamped;
  updateResultPanel(gfr);
  highlightStageCard(gfr);
  processAlbuminuria();
}

// ── Animar la aguja ───────────────────────────────────────────
let lastGfr = null;
let animFrame = null;

function animateNeedle(from, to, duration) {
  if (animFrame) cancelAnimationFrame(animFrame);
  const start    = performance.now();
  const fromVal  = from ?? to; // si no hay valor previo, empieza desde el mismo punto

  function step(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    // Ease in-out cubic
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const current = fromVal + (to - fromVal) * ease;
    drawSpeedometer(current);
    if (t < 1) animFrame = requestAnimationFrame(step);
  }
  animFrame = requestAnimationFrame(step);
}

// ── Sacudir input si es inválido ──────────────────────────────
function shakeInput(el) {
  el.style.animation = 'none';
  el.style.borderColor = '#ef4444';
  el.style.boxShadow  = '0 0 0 4px rgba(239,68,68,0.2)';
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow  = '';
  }, 1000);
}

// ── Construir grid de estadios ────────────────────────────────
function buildStagesGrid() {
  const grid = document.getElementById('stages-grid');
  // Mostrar en orden G1→G5
  const ordered = [...STAGES].reverse();
  ordered.forEach(stage => {
    const card = document.createElement('div');
    card.className = 'stage-card';
    card.id = `card-${stage.key}`;
    card.innerHTML = `
      <div class="stage-dot" style="background:${stage.color}; color:${stage.color};"></div>
      <div>
        <div class="stage-card-title" style="color:${stage.color};">${stage.label} — ${stage.name}</div>
        <div class="stage-card-range">TFG: ${stage.range} mL/min/1.73 m²</div>
        <div class="stage-card-desc">${stage.description}</div>
      </div>
    `;
    // Al hacer clic en la tarjeta → llenar el input y calcular
    card.addEventListener('click', () => {
      const mid = stage.min + (stage.max - stage.min) / 2;
      document.getElementById('gfr-input').value = Math.round(mid);
      calcular();
    });
    grid.appendChild(card);
  });
}

// ── Enter en el input dispara cálculo ────────────────────────
document.getElementById('gfr-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') calcular();
});

// ── Entrada en tiempo real ────────────────────────────────────
document.getElementById('gfr-input').addEventListener('input', () => {
  const raw = document.getElementById('gfr-input').value.trim();
  if (raw !== '' && !isNaN(parseFloat(raw))) {
    const gfr = Math.max(0, Math.min(200, parseFloat(raw)));
    const gfrClamped = Math.min(gfr, 120);
    drawSpeedometer(gfrClamped);
    updateResultPanel(gfr);
    highlightStageCard(gfr);
    lastGfr = gfrClamped;
  }
});

document.getElementById('alb-input').addEventListener('input', () => {
  // actualizar alb badge en tiempo real si el panel ya está visible
  if (!document.getElementById('result-panel').classList.contains('hidden')) {
    processAlbuminuria();
  }
});

// ── Inicialización ────────────────────────────────────────────
buildStagesGrid();
drawSpeedometer(null);  // velocímetro vacío al inicio

// ─────────────────────────────────────────────────────────────
//  ALBUMINURIA — Clasificación KDIGO
// ─────────────────────────────────────────────────────────────
const ALB_STAGES = [
  { key:'A1', label:'A1', range:'< 30 mg/g',   color:'#22c55e', name:'Normal a levemente aumentada',    desc:'Sin aumento significativo de proteínas en orina.' },
  { key:'A2', label:'A2', range:'30–300 mg/g',  color:'#f59e0b', name:'Moderadamente aumentada',          desc:'Aumento moderado de albúmina. Indica daño renal temprano.' },
  { key:'A3', label:'A3', range:'> 300 mg/g',   color:'#ef4444', name:'Severamente aumentada',            desc:'Proteinuria severa. Alto riesgo de progresión renal.' },
];

function getAlbStage(acr) {
  if (acr < 30)  return ALB_STAGES[0];
  if (acr <= 300) return ALB_STAGES[1];
  return ALB_STAGES[2];
}

function processAlbuminuria() {
  const albInput = document.getElementById('alb-input');
  const albResult = document.getElementById('alb-result');
  const raw = albInput.value.trim();
  if (raw === '' || isNaN(parseFloat(raw))) {
    albResult.classList.add('hidden');
    return;
  }
  const acr = Math.max(0, parseFloat(raw));
  const stage = getAlbStage(acr);
  document.getElementById('alb-badge').textContent = stage.label;
  document.getElementById('alb-badge').style.color = stage.color;
  document.getElementById('alb-badge').style.borderColor = stage.color;
  document.getElementById('alb-badge').style.boxShadow = `0 0 12px ${stage.color}55`;
  document.getElementById('alb-desc').innerHTML =
    `<strong style="color:${stage.color}">${stage.name}</strong><br><span>${stage.range}</span>`;
  albResult.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────
//  CKD-EPI 2021 — Calcular TFG
// ─────────────────────────────────────────────────────────────
let currentSex = 'M';       // 'M' | 'F'
let currentFormula = 'cr';   // 'cr' | 'crcys'

function setSex(sex) {
  currentSex = sex;
  document.getElementById('sex-m').classList.toggle('active', sex === 'M');
  document.getElementById('sex-f').classList.toggle('active', sex === 'F');
}

function switchFormula(formula) {
  currentFormula = formula;
  document.getElementById('tab-cr').classList.toggle('active', formula === 'cr');
  document.getElementById('tab-crcys').classList.toggle('active', formula === 'crcys');
  const rowCys = document.getElementById('row-cys');
  rowCys.style.display = formula === 'crcys' ? 'flex' : 'none';
}

function toggleAccordion() {
  const body = document.getElementById('accordion-body');
  const btn  = document.getElementById('accordion-btn');
  const isHidden = body.hidden;
  body.hidden = !isHidden;
  btn.setAttribute('aria-expanded', String(isHidden));
  btn.classList.toggle('open', isHidden);
}

// CKD-EPI 2021 — Solo Creatinina
function ckdEpi2021Cr(scr, age, sex) {
  const isFemale = sex === 'F';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1.0;
  const ratio = scr / kappa;
  return 142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.200) *
    Math.pow(0.9938, age) *
    sexFactor;
}

// CKD-EPI 2021 — Creatinina + Cistatina C
function ckdEpi2021CrCys(scr, scys, age, sex) {
  const isFemale = sex === 'F';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.219 : -0.144;
  const sexFactor = isFemale ? 0.963 : 1.0;
  const ratioCr  = scr  / kappa;
  const ratioCys = scys / 0.8;
  return 135 *
    Math.pow(Math.min(ratioCr, 1),  alpha) *
    Math.pow(Math.max(ratioCr, 1),  -0.544) *
    Math.pow(Math.min(ratioCys, 1), -0.323) *
    Math.pow(Math.max(ratioCys, 1), -0.778) *
    Math.pow(0.9961, age) *
    sexFactor;
}

function calcularEPI() {
  const ageVal = parseFloat(document.getElementById('epi-age').value);
  const crVal  = parseFloat(document.getElementById('epi-cr').value);

  if (isNaN(ageVal) || isNaN(crVal) || ageVal <= 0 || crVal <= 0) {
    const ageInput = document.getElementById('epi-age');
    const crInput  = document.getElementById('epi-cr');
    if (isNaN(ageVal) || ageVal <= 0) shakeInput(ageInput);
    if (isNaN(crVal)  || crVal  <= 0) shakeInput(crInput);
    return;
  }

  let gfr;
  if (currentFormula === 'crcys') {
    const cysVal = parseFloat(document.getElementById('epi-cys').value);
    if (isNaN(cysVal) || cysVal <= 0) {
      shakeInput(document.getElementById('epi-cys'));
      return;
    }
    gfr = ckdEpi2021CrCys(crVal, cysVal, ageVal, currentSex);
  } else {
    gfr = ckdEpi2021Cr(crVal, ageVal, currentSex);
  }

  gfr = Math.round(gfr * 10) / 10;  // 1 decimal
  // Rellenar el campo TFG y disparar cálculo
  const gfrInput = document.getElementById('gfr-input');
  gfrInput.value = gfr;
  // Animate input value feedback
  gfrInput.style.borderColor = 'var(--accent-1)';
  gfrInput.style.boxShadow = '0 0 0 4px rgba(56,189,248,.2)';
  setTimeout(() => { gfrInput.style.borderColor = ''; gfrInput.style.boxShadow = ''; }, 1200);

  calcular();

  // Cerrar acordeón
  const body = document.getElementById('accordion-body');
  if (!body.hidden) toggleAccordion();
}

// ─────────────────────────────────────────────────────────────
// VELOCÍMETRO PARA IMPRESIÓN (B&W, fondo blanco)
// ─────────────────────────────────────────────────────────────
function drawPrintSpeedometer(gfr) {
  const W = 700, H = 380;
  const offscreen = document.createElement('canvas');
  offscreen.width  = W;
  offscreen.height = H;
  const ctx = offscreen.getContext('2d');

  // Fondo blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H - 70;
  const maxRh = cx - 68;
  const maxRv = cy - 42;
  const R = Math.min(maxRh, maxRv);

  const startRad = degToRad(180);
  const endRad   = degToRad(360);

  // Línea base horizontal
  ctx.beginPath();
  ctx.moveTo(cx - R - 2, cy);
  ctx.lineTo(cx + R + 2, cy);
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Arco background
  ctx.beginPath();
  ctx.arc(cx, cy, R, startRad, endRad, false);
  ctx.lineWidth   = 44;
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Segmentos con grises escalonados (sin color = ahorra tinta)
  const GRAY_STAGES = [
    { min:0,  max:15,  gray:'#999' },
    { min:15, max:30,  gray:'#aaa' },
    { min:30, max:45,  gray:'#bbb' },
    { min:45, max:60,  gray:'#ccc' },
    { min:60, max:90,  gray:'#ddd' },
    { min:90, max:120, gray:'#e8e8e8' },
  ];
  GRAY_STAGES.forEach(seg => {
    const aS = gfrToAngle(seg.min);
    const aE = gfrToAngle(seg.max);
    ctx.beginPath();
    ctx.arc(cx, cy, R, aS, aE, false);
    ctx.lineWidth   = 40;
    ctx.strokeStyle = seg.gray;
    ctx.lineCap     = 'butt';
    ctx.stroke();
  });

  // Ticks y etiquetas
  const tickValues = [0, 15, 30, 45, 60, 90, 120];
  tickValues.forEach(val => {
    const angle = gfrToAngle(val);
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx + cosA * (R + 5),  cy + sinA * (R + 5));
    ctx.lineTo(cx + cosA * (R + 22), cy + sinA * (R + 22));
    ctx.strokeStyle = '#555';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.fillStyle    = '#333';
    ctx.font         = 'bold 13px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(val), cx + cosA * (R + 36), cy + sinA * (R + 36));
  });

  // Etiquetas de estadio dentro del arco
  const midR = R - 58;
  const STAGE_LABELS = [
    { label:'G5', midVal:7.5 },
    { label:'G4', midVal:22.5 },
    { label:'G3b',midVal:37.5 },
    { label:'G3a',midVal:52.5 },
    { label:'G2', midVal:75 },
    { label:'G1', midVal:105 },
  ];
  STAGE_LABELS.forEach(s => {
    const angle = gfrToAngle(s.midVal);
    const lx = cx + Math.cos(angle) * midR;
    const ly = cy + Math.sin(angle) * midR;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle    = '#444';
    ctx.font         = 'bold 11px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.label, 0, 0);
    ctx.restore();
  });

  // Aguja negra
  if (gfr !== null) {
    const needleAngle = gfrToAngle(Math.min(Math.max(gfr, 0), 120));
    const needleLen   = R - 12;
    const needleTail  = 26;
    const nx = Math.cos(needleAngle);
    const ny = Math.sin(needleAngle);
    const perpX = -ny * 4, perpY = nx * 4;

    ctx.beginPath();
    ctx.moveTo(cx + nx * needleLen, cy + ny * needleLen);
    ctx.lineTo(cx - nx * needleTail + perpX, cy - ny * needleTail + perpY);
    ctx.lineTo(cx - nx * needleTail - perpX, cy - ny * needleTail - perpY);
    ctx.closePath();
    ctx.fillStyle = '#111';
    ctx.fill();

    // Hub
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  // Etiquetas extremos
  ctx.fillStyle    = '#333';
  ctx.font         = 'bold 9px Inter, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FALLA', cx - R, cy + 8);
  ctx.fillText('RENAL', cx - R, cy + 19);
  ctx.fillText('NORMAL', cx + R, cy + 8);
  ctx.fillText('/ ALTA',  cx + R, cy + 19);

  return offscreen.toDataURL('image/png');
}

// ─────────────────────────────────────────────────────────────
// IMPRESIÓN (PDF)
// ─────────────────────────────────────────────────────────────
function printReport() {
  const tfgVal = document.getElementById('gfr-input').value.trim();
  if (!tfgVal) return;

  const gfrParsed = parseFloat(tfgVal);
  if (isNaN(gfrParsed)) return;

  const stage = getStage(gfrParsed) || getStageByGFR(gfrParsed);

  // Fecha
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'
  });
  document.getElementById('pr-date').textContent = dateStr;

  // TFG
  document.getElementById('pr-tfg').textContent = gfrParsed.toFixed(1);

  // Estadio
  const stageLine = document.getElementById('pr-stage-line');
  if (stage) {
    stageLine.textContent = `${stage.label} — ${stage.name}`;
    document.getElementById('pr-description').textContent = stage.description;
  }

  // Imagen del velocímetro (B&W limpio)
  const imgData = drawPrintSpeedometer(gfrParsed);
  document.getElementById('pr-speedometer-img').src = imgData;

  // Albuminuria
  const albRaw = document.getElementById('alb-input').value.trim();
  const prAlbBlock = document.getElementById('pr-alb-block');
  if (albRaw && !isNaN(parseFloat(albRaw))) {
    const albStage = getAlbStage(parseFloat(albRaw));
    document.getElementById('pr-alb-text').textContent =
      `${parseFloat(albRaw).toFixed(1)} mg/g — ${albStage.label}: ${albStage.name}`;
    prAlbBlock.style.display = 'block';
  } else {
    prAlbBlock.style.display = 'none';
  }

  window.print();
}

// ─────────────────────────────────────────────────────────────
// CONTADOR DE VISITAS
// ─────────────────────────────────────────────────────────────
(function loadVisitCount() {
  const el = document.getElementById('visit-count');
  if (!el) return;
  fetch('https://api.counterapi.dev/v1/jalzam-nefro-velocimetro/visits/up')
    .then(r => r.json())
    .then(data => {
      if (data && data.count != null) {
        el.textContent = Number(data.count).toLocaleString();
      } else { el.textContent = '--'; }
    })
    .catch(() => { el.textContent = '--'; });
})();

