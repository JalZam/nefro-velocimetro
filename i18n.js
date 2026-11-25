/* ============================================================
   VELOCÍMETRO RENAL — Idioma (español / inglés)

   El español vive en index.html y app.js; aquí está la traducción al
   inglés y el interruptor ES|EN. Se carga ANTES de app.js.

   Idioma inicial: el del navegador (español si está en español; si no,
   inglés). Lo que la persona elige con el interruptor se recuerda en su
   equipo (solo ese dato). `?lang=es|en` en la dirección manda sobre todo.
   Los robots de buscadores ven siempre el español, que es la versión
   original de esta dirección; la versión en inglés para buscadores es la
   guía gfr-chronic-kidney-disease.html.
   ============================================================ */

// ── Datos clínicos en inglés (los lee también tools/generar-guia.js) ──
const VR_DATOS_EN = {
  estadios: {
    G5:  { label: 'Stage 5',  name: 'Kidney Failure',
           description: 'Very severely reduced kidney function. May require dialysis or a kidney transplant.' },
    G4:  { label: 'Stage 4',  name: 'Severely Decreased',
           description: 'Severely reduced kidney function. It is important to prepare for kidney replacement therapy.' },
    G3b: { label: 'Stage 3b', name: 'Moderately to Severely Decreased',
           description: 'Moderately to severely reduced kidney function. Close follow-up and management of complications.' },
    G3a: { label: 'Stage 3a', name: 'Mildly to Moderately Decreased',
           description: 'Mildly to moderately reduced kidney function. Frequent monitoring of risk factors.' },
    G2:  { label: 'Stage 2',  name: 'Mildly Decreased',
           description: 'Mildly reduced kidney function. With markers of kidney damage (e.g. albuminuria).' },
    G1:  { label: 'Stage 1',  name: 'Normal or High',
           description: 'Normal or high kidney function. With markers of kidney damage (e.g. albuminuria).' },
  },
  albuminuria: {
    A1: { name: 'Normal to mildly increased', desc: 'No significant increase of protein in the urine.' },
    A2: { name: 'Moderately increased',       desc: 'Moderate increase in albumin. Indicates early kidney damage.' },
    A3: { name: 'Severely increased',         desc: 'Severe proteinuria. High risk of kidney disease progression.' },
  },
  riesgo: { low: 'Low', moderate: 'Moderate', high: 'High', veryhigh: 'Very high' },
};

// ── Textos fijos de index.html: [selector, HTML en inglés] ──
const VR_TEXTOS_EN = [
  ['.site-header .logo-sub', 'GFR · KDIGO 2024 · CKD-EPI 2021'],
  ['#link-guia', 'More information'],
  ['#link-kdigo', 'KDIGO 2024 Guidelines ↗'],
  ['.visit-counter .tx', 'visits'],
  ['.btn-reset .tx', 'New consultation'],
  ['.hero-title', 'How fast are your<br/><span class="gradient-text">kidneys working?</span>'],
  ['.hero-subtitle', 'Just as a car has a speedometer, your kidneys have their own "speed", called the <strong>Glomerular Filtration Rate (GFR)</strong>. The higher it is, the better your kidneys work.'],
  ['label[for="gfr-input"] .tx', 'Your GFR'],
  ['#accordion-btn .tx', 'Calculate GFR with CKD-EPI 2021'],
  ['#tab-cr', 'Creatinine only'],
  ['#tab-crcys', '+ Cystatin C'],
  ['#lbl-sexo', 'Sex'],
  ['label[for="epi-age"]', 'Age (years)'],
  ['label[for="epi-cr"]', 'Serum creatinine (mg/dL)'],
  ['label[for="epi-cys"]', 'Cystatin C (mg/L)'],
  ['.calc-epi-btn .tx', 'Calculate GFR'],
  ['.epi-note', 'CKD-EPI 2021 · Race-free · KDIGO'],
  ['#calc-btn .tx', 'Calculate'],
  ['.input-hint', 'Enter the GFR manually or calculate it above.'],
  ['.risk-result-label', 'KDIGO risk'],
  ['.risk-result-link', 'see grid ↓'],
  ['.print-btn .tx', 'Print patient handout'],
  ['.speedometer-title .tx', 'Kidney Speedometer'],
  ['.stages-section .section-title', 'Chronic Kidney Disease Stages — KDIGO'],
  ['.risk-section .section-title', 'Risk of progression — KDIGO grid (GFR × Albuminuria)'],
  ['.risk-intro', 'The outlook for the kidney does not depend on GFR alone: <strong>albuminuria</strong> weighs just as much. Find the cell where your two values cross — that is your level of risk.'],
  ['.risk-foot', 'The small number in each cell is the recommended number of kidney function check-ups per year. G1 and G2 with A1 are only considered chronic kidney disease if another marker of kidney damage is present.'],
  ['.explanation-content h3', 'How to use this tool during the visit'],
  ['.explanation-content ul',
    '<li>If you already have the patient\'s <strong>GFR</strong> and <strong>albuminuria (uACR)</strong>, enter them directly in the fields on the left.</li>' +
    '<li>If you need to calculate the GFR, open <strong>“Calculate GFR with CKD-EPI 2021”</strong>, enter creatinine, age and sex (optionally cystatin C) and press <strong>Calculate</strong>.</li>' +
    '<li>The <strong>speedometer</strong> shows the patient where their kidney function stands: the needle moves to the right the better the kidney filters.</li>' +
    '<li>With GFR and albuminuria, the <strong>KDIGO grid</strong> highlights the patient\'s cell and their risk of progression; use it to explain why albuminuria weighs as much as GFR.</li>' +
    '<li>Finally, <strong>“Print patient handout”</strong> produces a black-and-white summary to hand over, with optional space for the patient\'s name and the physician\'s.</li>'],
  ['.explanation-content .disclaimer', 'A support tool for the consultation. Interpretation is the responsibility of the treating physician.'],
  ['#link-guia-pie', 'More information: read the full explanation in text →'],
  ['.refs-title', 'References'],
  ['.refs-intro', 'The stages, the albuminuria thresholds, the risk grid and the calculation formula come directly from these two sources.'],
  ['#ref-tag-1', 'Stages, albuminuria and risk grid'],
  ['#ref-link-1', 'Full guideline &#8599;'],
  ['#ref-tag-2', 'GFR calculation'],
  ['.pr-title', 'Kidney Function Result'],
  ['#pr-lbl-paciente', 'Patient:'],
  ['#pr-lbl-medico', 'Physician:'],
  ['.pr-val-label', 'Glomerular Filtration Rate (GFR)'],
  ['#pr-alb-block .pr-alb-label', 'Albuminuria (uACR):'],
  ['#pr-risk-block .pr-alb-label', 'KDIGO risk (GFR × albuminuria):'],
  ['.pr-disclaimer', 'This sheet is informative and educational. It does not replace a medical consultation.&nbsp;·&nbsp; <strong>KDIGO 2024</strong> guidelines&nbsp;·&nbsp;<strong>CKD-EPI 2021</strong> formula&nbsp;·&nbsp;velocimetrorenal.com'],
  ['.pro-notice', '<strong>Tool for professional use.</strong> Designed for the physician to explain to the patient their kidney disease and their risk of progression. Interpretation is the responsibility of the treating physician.'],
  ['#pie-linea', 'Educational tool based on the <strong>KDIGO 2024</strong> guidelines · <strong>CKD-EPI 2021</strong> formula · Professional and educational use'],
  ['.privacy summary', 'Data use policy'],
  ['.privacy-body',
    '<p><strong>What you type never leaves your browser.</strong> GFR, albuminuria, creatinine, cystatin C, age and sex are processed only on your device. They are not sent to any server, they are not stored in any database and they disappear when you close or reload the page.</p>' +
    '<p><strong>We do not use cookies.</strong> The only thing saved on your device is the language you choose (Spanish or English), so the page opens in that language next time. <strong>There is no advertising and no ad tracking.</strong></p>' +
    '<p>As with any web page, when you open it your IP address is visible to the services that deliver it:</p>' +
    '<ul>' +
    '<li><strong>GitHub Pages</strong> — hosts the site</li>' +
    '<li><strong>Google Fonts</strong> — delivers the typefaces</li>' +
    '<li><strong>hits.sh</strong> — counts total visits; it does not identify people</li>' +
    '<li><strong>GoatCounter</strong> — cookie-free usage statistics: it records the page visited, date, country, language, type of device and referring site. It also records how many times the calculator is used (direct GFR or CKD-EPI formula), without the values entered. It does not store the IP address or persistent identifiers. Data hosted in the European Union (Finland/Germany).</li>' +
    '</ul>' +
    '<p>None of them receives your clinical values, because those are never transmitted.</p>' +
    '<p class="privacy-legal">Site owner: <strong>CiMedical</strong> · Contact: <a href="mailto:juanjallerch@cimedical.co">juanjallerch@cimedical.co</a>. Under Colombian Law 1581 of 2012, you may send any question, complaint or request about the processing of personal data to that address.</p>'],
];

// ── Atributos: [selector, atributo, valor en inglés] ──
const VR_ATRIB_EN = [
  ['#link-guia', 'href', 'gfr-chronic-kidney-disease.html'],
  ['#link-guia', 'title', 'Explanation in text: GFR, CKD-EPI 2021, stages, albuminuria and KDIGO risk'],
  ['#link-guia-pie', 'href', 'gfr-chronic-kidney-disease.html'],
  ['.visit-badge', 'alt', 'visits'],
  ['.visit-counter', 'title', 'Total site visits (hits.sh): counts page loads, does not identify people'],
  ['.btn-reset', 'title', 'New consultation'],
  ['#gfr-input', 'placeholder', 'e.g. 55'],
  ['#alb-input', 'placeholder', 'e.g. 45'],
  ['#epi-age', 'placeholder', 'e.g. 55'],
  ['#epi-cr', 'placeholder', 'e.g. 1.2'],
  ['#epi-cys', 'placeholder', 'e.g. 1.1'],
  ['#sex-m', 'title', 'Male'],
  ['#sex-f', 'title', 'Female'],
  ['#patient-name', 'placeholder', 'Patient name (optional)'],
  ['#doctor-name', 'placeholder', 'Physician (optional)'],
  ['.print-btn', 'title', 'Print / Save as PDF'],
  ['#pr-speedometer-img', 'alt', 'Speedometer'],
  ['meta[name="description"]', 'content', 'Free tool for health professionals: explain kidney function to your patient with a GFR speedometer, calculate GFR with CKD-EPI 2021 (creatinine and cystatin C), classify albuminuria and place the risk of progression on the KDIGO 2024 grid.'],
];

const VR_TITULO_EN = 'Velocímetro Renal (Kidney Speedometer) — GFR calculator (CKD-EPI 2021) and KDIGO risk to explain to your patient';

// ── Estado e interruptor ─────────────────────────────────────
var VR = (function () {
  const CLAVE = 'vr-lang';
  let lang = 'es';

  const esRobot = /bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent || '');
  if (!esRobot) {
    try {
      const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      if (nav && !/^es\b/i.test(nav)) lang = 'en';
    } catch (e) { /* sin dato: español */ }
    try {
      const g = localStorage.getItem(CLAVE);
      if (g === 'es' || g === 'en') lang = g;
    } catch (e) { /* almacenamiento bloqueado: queda el del navegador */ }
  }
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'es' || q === 'en') lang = q;
  } catch (e) { /* nada */ }

  const original = new Map();   // elemento → HTML en español
  const origAttr = [];          // [elemento, atributo, valor en español]
  let tituloEs = null;
  let preparado = false;

  function preparar() {
    if (preparado) return;
    preparado = true;
    tituloEs = document.title;
    VR_TEXTOS_EN.forEach(([sel]) => {
      const el = document.querySelector(sel);
      if (el) original.set(sel, el.innerHTML);
      else console.warn('[idioma] no encontré', sel);
    });
    VR_ATRIB_EN.forEach(([sel, attr]) => {
      const el = document.querySelector(sel);
      if (el) origAttr.push([sel, attr, el.getAttribute(attr)]);
      else console.warn('[idioma] no encontré', sel);
    });
  }

  function aplicar() {
    preparar();
    const en = lang === 'en';
    document.documentElement.lang = lang;
    document.title = en ? VR_TITULO_EN : tituloEs;
    VR_TEXTOS_EN.forEach(([sel, html]) => {
      const el = document.querySelector(sel);
      if (el && original.has(sel)) el.innerHTML = en ? html : original.get(sel);
    });
    VR_ATRIB_EN.forEach(([sel, attr, valor], i) => {
      const el = document.querySelector(sel);
      const o = origAttr.find(x => x[0] === sel && x[1] === attr);
      if (!el || !o) return;
      const v = en ? valor : o[2];
      if (v === null) el.removeAttribute(attr); else el.setAttribute(attr, v);
    });
    document.querySelectorAll('.lang-switch button').forEach(b => {
      const activo = b.getAttribute('data-lang') === lang;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', String(activo));
    });
    if (typeof vrRepintar === 'function') vrRepintar();
  }

  function fijar(nuevo) {
    if (nuevo !== 'es' && nuevo !== 'en') return;
    lang = nuevo;
    try { localStorage.setItem(CLAVE, lang); } catch (e) { /* no pasa nada */ }
    // Si la dirección traía ?lang=, se ajusta para que «Nueva consulta» (recarga) conserve el idioma
    try {
      const u = new URL(location.href);
      if (u.searchParams.has('lang')) {
        u.searchParams.set('lang', lang);
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      }
    } catch (e) { /* nada */ }
    aplicar();
  }

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.lang-switch button');
    if (b) fijar(b.getAttribute('data-lang'));
  });

  return {
    get lang() { return lang; },
    aplicar,
    fijar,
  };
})();

// Texto según el idioma, para los literales de app.js
function tr(es, en) { return VR.lang === 'en' ? en : es; }
