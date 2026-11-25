#!/usr/bin/env node
/* ============================================================
   Genera tfg-enfermedad-renal-cronica.html, la guía en texto del
   Velocímetro Renal (para buscadores y asistentes de IA, y como
   página de «Más información»).

   Los estadios, la albuminuria, la cuadrícula de riesgo y las
   fórmulas se LEEN de app.js: así la guía nunca dice algo distinto
   de la calculadora. Uso:  node tools/generar-guia.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ARCHIVO = 'tfg-enfermedad-renal-cronica.html';
const SITIO = 'https://velocimetrorenal.com/';
const URL_GUIA = SITIO + ARCHIVO;
const HOY = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
const [AA, MM, DD] = HOY.split('-').map(Number);
const FECHA_LARGA = `${DD} de ${MESES[MM - 1]} de ${AA}`;

// ── Leer los datos de app.js ─────────────────────────────────
const app = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');

function bloque(nombre, abre, cierra) {
  const i = app.indexOf(`const ${nombre} = ${abre}`);
  if (i < 0) throw new Error(`No encontré ${nombre} en app.js`);
  const f = app.indexOf(`\n${cierra};`, i);
  if (f < 0) throw new Error(`No encontré el final de ${nombre} en app.js`);
  return app.slice(i, f + cierra.length + 2);
}
function funcion(nombre) {
  const i = app.indexOf(`function ${nombre}(`);
  if (i < 0) throw new Error(`No encontré la función ${nombre} en app.js`);
  const f = app.indexOf('\n}', i);
  return app.slice(i, f + 2);
}

const codigo = [
  bloque('STAGES', '[', ']'),
  bloque('ALB_STAGES', '[', ']'),
  bloque('RISK_LEVELS', '{', '}'),
  bloque('RISK_MATRIX', '{', '}'),
  bloque('MONITOR_FREQ', '{', '}'),
  funcion('ckdEpi2021Cr'),
  funcion('ckdEpi2021CrCys'),
  'return { STAGES, ALB_STAGES, RISK_LEVELS, RISK_MATRIX, MONITOR_FREQ, ckdEpi2021Cr, ckdEpi2021CrCys };',
].join('\n');
const D = new Function(codigo)();

// Comprobaciones: si alguien cambia app.js y la guía dejaría de cuadrar, falla.
const ORDEN = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'];
const porClave = {};
D.STAGES.forEach(s => { porClave[s.key] = s; });
ORDEN.forEach(k => {
  if (!porClave[k] || !D.RISK_MATRIX[k] || !D.MONITOR_FREQ[k]) throw new Error(`Falta el estadio ${k} en app.js`);
});
if (D.ALB_STAGES.length !== 3) throw new Error('Se esperaban 3 categorías de albuminuria');

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const coma = n => String(n).replace('.', ',');
const una = n => coma(Math.round(n * 10) / 10);

// ── Ejemplos calculados con las mismas funciones de la calculadora ──
const EJ1 = { sexo: 'M', edad: 55, cr: 1.2 };
const EJ2 = { sexo: 'F', edad: 60, cr: 1.0, cys: 1.1 };
const tfg1 = D.ckdEpi2021Cr(EJ1.cr, EJ1.edad, EJ1.sexo);
const tfg2 = D.ckdEpi2021CrCys(EJ2.cr, EJ2.cys, EJ2.edad, EJ2.sexo);
function estadioDe(gfr) {
  return D.STAGES.find(s => gfr >= s.min && gfr < s.max) || (gfr >= 90 ? porClave.G1 : porClave.G5);
}
const est1 = estadioDe(tfg1);
const est2 = estadioDe(tfg2);

// ── Tablas ───────────────────────────────────────────────────
const filasEstadios = ORDEN.map(k => {
  const s = porClave[k];
  return `          <tr><th scope="row">${k}</th><td>${esc(s.range)}</td><td>${esc(s.name)}</td><td>${esc(s.description)}</td></tr>`;
}).join('\n');

const filasAlb = D.ALB_STAGES.map(a =>
  `          <tr><th scope="row">${a.key}</th><td>${esc(a.range)}</td><td>${esc(a.name)}</td><td>${esc(a.desc)}</td></tr>`
).join('\n');

const veces = f => (f === 1 ? '1 control al año' : `${f} controles al año`);
const filasRiesgo = ORDEN.map(k => {
  const s = porClave[k];
  const celdas = D.RISK_MATRIX[k].map((nivel, i) => {
    const l = D.RISK_LEVELS[nivel];
    return `<td class="gt-r-${l.key}"><strong>${esc(l.name)}</strong><br>${veces(D.MONITOR_FREQ[k][i])}</td>`;
  }).join('');
  return `          <tr><th scope="row">${k}<br><span class="gt-sub">${esc(s.range)} mL/min/1,73 m²</span></th>${celdas}</tr>`;
}).join('\n');

const listaRiesgo = ORDEN.map(k => {
  const partes = D.RISK_MATRIX[k].map((nivel, i) =>
    `con ${D.ALB_STAGES[i].key}, riesgo ${D.RISK_LEVELS[nivel].name.toLowerCase()} (${veces(D.MONITOR_FREQ[k][i])})`);
  return `        <li><strong>${k}</strong> (TFG ${esc(porClave[k].range)}): ${partes.join('; ')}.</li>`;
}).join('\n');

// ── Preguntas frecuentes (también van como datos estructurados) ──
const FAQ = [
  ['¿Qué es el Velocímetro Renal?',
    'Es una herramienta web gratuita para que el médico le explique al paciente, en la consulta, cómo está su función renal. Muestra la tasa de filtración glomerular (TFG) como la aguja de un velocímetro sobre los estadios G1 a G5 de KDIGO, clasifica la albuminuria (A1 a A3) y ubica al paciente en la cuadrícula de riesgo KDIGO.'],
  ['¿Qué fórmula usa para calcular la TFG?',
    'CKD-EPI 2021, con creatinina sola o con creatinina y cistatina C. Son las ecuaciones publicadas por Inker y colaboradores en el New England Journal of Medicine en 2021. No usan la variable de raza.'],
  ['¿Qué datos se necesitan para calcular la TFG?',
    'Sexo, edad en años y creatinina sérica en mg/dL. De forma opcional, cistatina C en mg/L. Si ya se conoce la TFG, se puede escribir directamente sin calcularla.'],
  ['¿Cuáles son los estadios de la enfermedad renal crónica según la TFG?',
    ORDEN.map(k => `${k}: TFG ${porClave[k].range} mL/min/1,73 m² (${porClave[k].name.toLowerCase()})`).join('; ') +
    '. G1 y G2 con albuminuria A1 solo se consideran enfermedad renal crónica si existe otro marcador de daño renal.'],
  ['¿Cómo se clasifica la albuminuria?',
    D.ALB_STAGES.map(a => `${a.key}: ${a.range} (${a.name.toLowerCase()})`).join('; ') +
    '. Se mide como relación albúmina/creatinina en orina (RAC o uACR).'],
  ['¿Qué es la cuadrícula de riesgo KDIGO?',
    'Es una tabla que cruza el estadio de TFG (G1 a G5) con la categoría de albuminuria (A1 a A3). Cada casilla indica el riesgo de progresión (bajo, moderado, alto o muy alto) y cuántos controles de función renal se recomiendan al año. Muestra que la albuminuria pesa tanto como la TFG en el pronóstico.'],
  ['¿El Velocímetro Renal guarda los datos del paciente?',
    'No. Todo el cálculo ocurre en el navegador. Los valores no se envían a ningún servidor, no se guardan y desaparecen al cerrar o recargar la página. No usa cookies ni publicidad.'],
  ['¿Sirve para autodiagnóstico?',
    'No. Es una herramienta de apoyo para la consulta. La interpretación corresponde al médico tratante.'],
  ['¿Cuánto cuesta?',
    'Es gratuito y no tiene publicidad.'],
];
const faqHtml = FAQ.map(([p, r]) => `      <h3>${esc(p)}</h3>\n      <p>${esc(r)}</p>`).join('\n');

// ── Datos estructurados ──────────────────────────────────────
const TITULO = 'Tasa de filtración glomerular (TFG), albuminuria y riesgo KDIGO: explicación del Velocímetro Renal';
const DESC = 'Qué es la TFG, cómo se calcula con CKD-EPI 2021 (creatinina y cistatina C), los estadios G1 a G5 de la enfermedad renal crónica, las categorías de albuminuria A1 a A3 y la cuadrícula de riesgo KDIGO 2024, en texto y con referencias.';
const AUTOR = { '@type': 'Person', name: 'Juan José Jaller', jobTitle: 'Médico nefrólogo' };
const ld = [
  {
    '@context': 'https://schema.org',
    '@type': ['MedicalWebPage', 'LearningResource'],
    '@id': URL_GUIA,
    url: URL_GUIA,
    name: TITULO,
    headline: TITULO,
    description: DESC,
    inLanguage: 'es',
    datePublished: '2026-11-25',
    dateModified: HOY,
    isAccessibleForFree: true,
    author: AUTOR,
    publisher: { '@type': 'Organization', name: 'CiMedical' },
    audience: { '@type': 'MedicalAudience', audienceType: 'Clinician' },
    about: [
      { '@type': 'MedicalCondition', name: 'Enfermedad renal crónica', alternateName: 'Chronic kidney disease' },
      { '@type': 'MedicalTest', name: 'Tasa de filtración glomerular estimada', alternateName: ['TFG', 'eGFR', 'CKD-EPI 2021'] },
      { '@type': 'MedicalTest', name: 'Relación albúmina/creatinina en orina', alternateName: ['RAC', 'uACR', 'Albuminuria'] },
    ],
    isPartOf: { '@id': SITIO + '#sitio' },
    image: SITIO + 'img/og.png',
    citation: [
      'KDIGO CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.',
      'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749. doi:10.1056/NEJMoa2102953',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(([p, r]) => ({
      '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r },
    })),
  },
];

// ── Página ───────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- GENERADA por tools/generar-guia.js a partir de app.js. No editar a mano. -->
  <title>TFG, albuminuria y riesgo KDIGO: explicación en texto — Velocímetro Renal</title>
  <meta name="description" content="${esc(DESC)}" />
  <link rel="canonical" href="${URL_GUIA}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Velocímetro Renal" />
  <meta property="og:title" content="${esc(TITULO)}" />
  <meta property="og:description" content="${esc(DESC)}" />
  <meta property="og:url" content="${URL_GUIA}" />
  <meta property="og:locale" content="es_CO" />
  <meta property="og:image" content="${SITIO}img/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="img/icono.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css?v=2" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>

  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="./">
        <svg class="logo-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <ellipse cx="14" cy="20" rx="8" ry="13" stroke="#2563eb" stroke-width="2.5" fill="none" opacity="0.7"/>
          <ellipse cx="26" cy="20" rx="8" ry="13" stroke="#2563eb" stroke-width="2.5" fill="none"/>
        </svg>
        <div>
          <div class="logo-title">Velocímetro Renal</div>
          <div class="logo-sub">Explicación en texto · TFG · KDIGO 2024 · CKD-EPI 2021</div>
        </div>
      </a>
      <nav class="header-right">
        <a class="header-link header-info sin-icono" href="./">← Ir a la calculadora</a>
      </nav>
    </div>
  </header>

  <main class="gt-main">
    <article class="card gt">
      <h1 class="gt-titulo">${esc(TITULO)}</h1>
      <p class="gt-fecha">Autor: Juan José Jaller, médico nefrólogo · Responsable del sitio: CiMedical · Actualizada el <time datetime="${HOY}">${FECHA_LARGA}</time></p>
      <p>Esta página explica, en texto, lo mismo que muestra la <a href="./">calculadora del Velocímetro Renal</a>:
      qué es la tasa de filtración glomerular (TFG), cómo se calcula, en qué estadio de enfermedad renal crónica
      queda cada valor, cómo se clasifica la albuminuria y cómo se cruzan las dos en la cuadrícula de riesgo de
      KDIGO. Los rangos y las fórmulas son exactamente los que usa la calculadora.</p>
      <p class="gt-aviso">Herramienta de apoyo para la consulta. La interpretación corresponde al médico tratante. No es una herramienta de autodiagnóstico.</p>

      <nav class="gt-indice" aria-label="Contenido">
        <h2>Contenido</h2>
        <ol>
          <li><a href="#que-es">Qué es el Velocímetro Renal</a></li>
          <li><a href="#tfg">Qué es la TFG</a></li>
          <li><a href="#ckd-epi">Cómo se calcula: CKD-EPI 2021</a></li>
          <li><a href="#estadios">Estadios G1 a G5</a></li>
          <li><a href="#albuminuria">Albuminuria A1 a A3</a></li>
          <li><a href="#riesgo">Cuadrícula de riesgo KDIGO</a></li>
          <li><a href="#uso">Cómo usarlo en consulta</a></li>
          <li><a href="#privacidad">Privacidad</a></li>
          <li><a href="#preguntas">Preguntas frecuentes</a></li>
          <li><a href="#referencias">Referencias</a></li>
        </ol>
      </nav>

      <section id="que-es">
        <h2>Qué es el Velocímetro Renal</h2>
        <p>El Velocímetro Renal (<a href="./">velocimetrorenal.com</a>) es una herramienta web gratuita para que el
        médico le explique al paciente, en la consulta, su función renal y su riesgo de progresión de enfermedad
        renal crónica. La pantalla le habla al paciente con una comparación sencilla: así como un carro tiene
        velocímetro, los riñones tienen su propia «velocidad», la tasa de filtración glomerular. Entre más alta,
        mejor funciona el riñón.</p>
        <p>La herramienta hace cinco cosas:</p>
        <ul>
          <li>Muestra la TFG como la aguja de un velocímetro sobre los estadios G1 a G5 de KDIGO.</li>
          <li>Calcula la TFG con la fórmula CKD-EPI 2021 (creatinina, o creatinina y cistatina C), sin variable de raza.</li>
          <li>Clasifica la albuminuria en A1, A2 o A3 según la relación albúmina/creatinina en orina.</li>
          <li>Ubica al paciente en la cuadrícula de riesgo KDIGO (TFG × albuminuria), con el nivel de riesgo y la frecuencia de control anual de su casilla.</li>
          <li>Genera una hoja para el paciente, para imprimir o guardar en PDF.</li>
        </ul>
      </section>

      <section id="tfg">
        <h2>Qué es la TFG</h2>
        <p>La tasa de filtración glomerular (TFG; en inglés GFR, y eGFR cuando es estimada) es la medida de qué tan
        bien filtran los riñones. Se expresa en mL/min/1,73 m². En el velocímetro, la aguja se mueve a la derecha
        cuanto mejor filtra el riñón; la escala va de 0 a 120.</p>
        <p>El pronóstico del riñón no depende solo de la TFG: la albuminuria pesa igual. Por eso la herramienta
        pide los dos valores y los cruza en la <a href="#riesgo">cuadrícula de riesgo</a>.</p>
      </section>

      <section id="ckd-epi">
        <h2>Cómo se calcula: CKD-EPI 2021</h2>
        <p>Si no se tiene la TFG, la herramienta la estima con las ecuaciones CKD-EPI 2021 (Inker y colaboradores,
        N Engl J Med 2021), que no usan la variable de raza. Hay dos versiones.</p>

        <h3>Solo creatinina</h3>
        <p class="gt-formula">TFG = 142 × mín(Cr/κ, 1)<sup>α</sup> × máx(Cr/κ, 1)<sup>−1,200</sup> × 0,9938<sup>edad</sup> × 1,012 (si es mujer)</p>
        <ul>
          <li>Cr: creatinina sérica en mg/dL. Edad en años.</li>
          <li>κ: 0,7 en mujeres y 0,9 en hombres.</li>
          <li>α: −0,241 en mujeres y −0,302 en hombres.</li>
        </ul>

        <h3>Creatinina y cistatina C</h3>
        <p class="gt-formula">TFG = 135 × mín(Cr/κ, 1)<sup>α</sup> × máx(Cr/κ, 1)<sup>−0,544</sup> × mín(Cis/0,8, 1)<sup>−0,323</sup> × máx(Cis/0,8, 1)<sup>−0,778</sup> × 0,9961<sup>edad</sup> × 0,963 (si es mujer)</p>
        <ul>
          <li>Cis: cistatina C sérica en mg/L.</li>
          <li>κ: 0,7 en mujeres y 0,9 en hombres.</li>
          <li>α: −0,219 en mujeres y −0,144 en hombres.</li>
        </ul>

        <h3>Ejemplos</h3>
        <ul>
          <li>Hombre de ${EJ1.edad} años con creatinina de ${coma(EJ1.cr)} mg/dL (solo creatinina): TFG de ${una(tfg1)} mL/min/1,73 m², estadio ${est1.key}.</li>
          <li>Mujer de ${EJ2.edad} años con creatinina de ${coma(EJ2.cr)} mg/dL y cistatina C de ${coma(EJ2.cys)} mg/L: TFG de ${una(tfg2)} mL/min/1,73 m², estadio ${est2.key}.</li>
        </ul>
        <p>La calculadora redondea el resultado a un decimal y acepta edades desde los 18 años.</p>
      </section>

      <section id="estadios">
        <h2>Estadios de enfermedad renal crónica según la TFG (G1 a G5)</h2>
        <div class="gt-tabla-wrap">
        <table class="gt-tabla">
          <thead><tr><th scope="col">Estadio</th><th scope="col">TFG (mL/min/1,73 m²)</th><th scope="col">Nombre</th><th scope="col">Qué significa</th></tr></thead>
          <tbody>
${filasEstadios}
          </tbody>
        </table>
        </div>
        <p>G1 y G2 con albuminuria A1 solo se consideran enfermedad renal crónica si existe otro marcador de daño renal.</p>
      </section>

      <section id="albuminuria">
        <h2>Categorías de albuminuria (A1 a A3)</h2>
        <p>La albuminuria se mide como relación albúmina/creatinina en una muestra de orina (RAC; en inglés uACR), en mg/g.</p>
        <div class="gt-tabla-wrap">
        <table class="gt-tabla">
          <thead><tr><th scope="col">Categoría</th><th scope="col">uACR</th><th scope="col">Nombre</th><th scope="col">Qué significa</th></tr></thead>
          <tbody>
${filasAlb}
          </tbody>
        </table>
        </div>
      </section>

      <section id="riesgo">
        <h2>Cuadrícula de riesgo KDIGO (TFG × albuminuria)</h2>
        <p>La cuadrícula cruza el estadio de TFG con la categoría de albuminuria. Cada casilla da el nivel de
        riesgo de progresión y el número de controles de función renal recomendados al año.</p>
        <div class="gt-tabla-wrap">
        <table class="gt-tabla gt-riesgo">
          <thead><tr><th scope="col">TFG ↓ · Albuminuria →</th>${D.ALB_STAGES.map(a => `<th scope="col">${a.key}<br><span class="gt-sub">${esc(a.range)}</span></th>`).join('')}</tr></thead>
          <tbody>
${filasRiesgo}
          </tbody>
        </table>
        </div>
        <p>La misma cuadrícula, en texto:</p>
        <ul>
${listaRiesgo}
        </ul>
        <p>«4+» significa cuatro o más controles al año.</p>
      </section>

      <section id="uso">
        <h2>Cómo usarlo en consulta</h2>
        <ol class="gt-pasos">
          <li>Si ya tiene la TFG y la albuminuria (RAC / uACR) del paciente, ingréselas directamente.</li>
          <li>Si necesita calcular la TFG, abra «Calcular TFG con CKD-EPI 2021», ingrese creatinina, edad y sexo (opcionalmente cistatina C) y pulse «Calcular».</li>
          <li>El velocímetro muestra al paciente dónde está su función renal: la aguja se mueve a la derecha cuanto mejor filtra el riñón.</li>
          <li>Con TFG y albuminuria, la cuadrícula KDIGO resalta la casilla del paciente y su riesgo de progresión; úsela para explicar por qué la albuminuria pesa tanto como la TFG.</li>
          <li>Al final, «Imprimir hoja para paciente» genera un resumen en blanco y negro para entregar, con espacio opcional para el nombre del paciente y el del médico.</li>
        </ol>
        <p><a href="./"><strong>Abrir la calculadora →</strong></a></p>
      </section>

      <section id="privacidad">
        <h2>Privacidad</h2>
        <p>Todo el cálculo ocurre en el navegador. La TFG, la albuminuria, la creatinina, la cistatina C, la edad y
        el sexo no se envían a ningún servidor, no se guardan y desaparecen al cerrar o recargar la página. No hay
        cookies ni publicidad. El detalle está en la «Política de uso de datos», al pie de la
        <a href="./">calculadora</a>.</p>
      </section>

      <section id="preguntas">
        <h2>Preguntas frecuentes</h2>
${faqHtml}
      </section>

      <section id="referencias">
        <h2>Referencias</h2>
        <ol class="gt-refs">
          <li>Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. <em>KDIGO 2024 Clinical Practice
          Guideline for the Evaluation and Management of Chronic Kidney Disease.</em> Kidney Int.
          2024;105(4S):S117–S314. <a href="https://kdigo.org/guidelines/ckd-evaluation-and-management/" target="_blank" rel="noopener">Guía completa ↗</a>
          (estadios, albuminuria y cuadrícula de riesgo).</li>
          <li>Inker LA, Eneanya ND, Coresh J, et al. <em>New creatinine- and cystatin C–based equations to estimate
          GFR without race.</em> N Engl J Med. 2021;385(19):1737–1749.
          <a href="https://doi.org/10.1056/NEJMoa2102953" target="_blank" rel="noopener">doi:10.1056/NEJMoa2102953 ↗</a>
          (cálculo de la TFG).</li>
        </ol>
      </section>
    </article>
  </main>

  <footer class="site-footer">
    <p class="pro-notice">
      <strong>Herramienta de uso profesional.</strong> Diseñada para que el médico explique al paciente
      su enfermedad renal y su riesgo de progresión. La interpretación corresponde al médico tratante.
    </p>
    <p><a href="./">Calculadora</a> · Guías <strong>KDIGO 2024</strong> · Fórmula <strong>CKD-EPI 2021</strong> · Responsable del sitio: <strong>CiMedical</strong></p>
  </footer>

  <!-- Analítica sin cookies ni IP (GoatCounter): cuenta visitas únicas, no identifica personas -->
  <script data-goatcounter="https://velocimetrorenal.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(RAIZ, ARCHIVO), html);
const texto = html.slice(html.indexOf('<main')).replace(/<[^>]+>/g, ' ');
console.log(ARCHIVO, '·', texto.split(/\s+/).length, 'palabras');
console.log(`Ejemplo 1: ${una(tfg1)} (${est1.key}) · Ejemplo 2: ${una(tfg2)} (${est2.key})`);
