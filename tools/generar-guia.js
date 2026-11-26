#!/usr/bin/env node
/* ============================================================
   Genera las guías en texto del Velocímetro Renal (para buscadores
   y asistentes de IA, y como página de «Más información»):

     tfg-enfermedad-renal-cronica.html   español
     gfr-chronic-kidney-disease.html     inglés

   Los estadios, la albuminuria, la cuadrícula de riesgo y las
   fórmulas se LEEN de app.js (español) y de i18n.js (inglés): así
   las guías nunca dicen algo distinto de la calculadora.
   Uso:  node tools/generar-guia.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SITIO = 'https://velocimetrorenal.com/';
const VER_CSS = 3;   // el mismo ?v= de style.css que usa index.html
const HOY = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
const [AA, MM, DD] = HOY.split('-').map(Number);
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

// ── Leer los datos de app.js e i18n.js ───────────────────────
const app = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
const i18n = fs.readFileSync(path.join(RAIZ, 'i18n.js'), 'utf8');

function bloque(fuente, nombre, abre, cierra) {
  const i = fuente.indexOf(`const ${nombre} = ${abre}`);
  if (i < 0) throw new Error(`No encontré ${nombre}`);
  const f = fuente.indexOf(`\n${cierra};`, i);
  if (f < 0) throw new Error(`No encontré el final de ${nombre}`);
  return fuente.slice(i, f + cierra.length + 2);
}
function funcion(nombre) {
  const i = app.indexOf(`function ${nombre}(`);
  if (i < 0) throw new Error(`No encontré la función ${nombre} en app.js`);
  return app.slice(i, app.indexOf('\n}', i) + 2);
}

const D = new Function([
  bloque(app, 'STAGES', '[', ']'),
  bloque(app, 'ALB_STAGES', '[', ']'),
  bloque(app, 'RISK_LEVELS', '{', '}'),
  bloque(app, 'RISK_MATRIX', '{', '}'),
  bloque(app, 'MONITOR_FREQ', '{', '}'),
  bloque(i18n, 'VR_DATOS_EN', '{', '}'),
  funcion('ckdEpi2021Cr'),
  funcion('ckdEpi2021CrCys'),
  'return { STAGES, ALB_STAGES, RISK_LEVELS, RISK_MATRIX, MONITOR_FREQ, VR_DATOS_EN, ckdEpi2021Cr, ckdEpi2021CrCys };',
].join('\n'))();

// Comprobaciones: si alguien cambia los datos y las guías dejarían de cuadrar, falla.
const ORDEN = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'];
const porClave = {};
D.STAGES.forEach(s => { porClave[s.key] = s; });
ORDEN.forEach(k => {
  if (!porClave[k] || !D.RISK_MATRIX[k] || !D.MONITOR_FREQ[k]) throw new Error(`Falta el estadio ${k} en app.js`);
  if (!D.VR_DATOS_EN.estadios[k]) throw new Error(`Falta el estadio ${k} en inglés (i18n.js)`);
});
if (D.ALB_STAGES.length !== 3) throw new Error('Se esperaban 3 categorías de albuminuria');
D.ALB_STAGES.forEach(a => {
  if (!D.VR_DATOS_EN.albuminuria[a.key]) throw new Error(`Falta ${a.key} en inglés (i18n.js)`);
});
Object.keys(D.RISK_LEVELS).forEach(k => {
  if (!D.VR_DATOS_EN.riesgo[k]) throw new Error(`Falta el nivel de riesgo ${k} en inglés (i18n.js)`);
});

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Ejemplos calculados con las mismas funciones de la calculadora
const EJ1 = { sexo: 'M', edad: 55, cr: 1.2 };
const EJ2 = { sexo: 'F', edad: 60, cr: 1.0, cys: 1.1 };
const tfg1 = D.ckdEpi2021Cr(EJ1.cr, EJ1.edad, EJ1.sexo);
const tfg2 = D.ckdEpi2021CrCys(EJ2.cr, EJ2.cys, EJ2.edad, EJ2.sexo);
const estadioDe = gfr => D.STAGES.find(s => gfr >= s.min && gfr < s.max) || (gfr >= 90 ? porClave.G1 : porClave.G5);
const est1 = estadioDe(tfg1).key;
const est2 = estadioDe(tfg2).key;

// ── Textos por idioma ────────────────────────────────────────
const L = {
  es: {
    archivo: 'tfg-enfermedad-renal-cronica.html',
    calc: './?lang=es',
    num: n => String(n).replace('.', ','),
    unidad: 'mL/min/1,73 m²',
    fecha: `${DD} de ${MESES_ES[MM - 1]} de ${AA}`,
    locale: 'es_CO',
    estadio: k => porClave[k],
    alb: a => a,
    riesgo: k => D.RISK_LEVELS[k].name,
    veces: f => (f === 1 ? '1 control al año' : `${f} controles al año`),
    tituloPag: 'TFG, albuminuria y riesgo KDIGO: explicación en texto — Velocímetro Renal',
    titulo: 'Tasa de filtración glomerular (TFG), albuminuria y riesgo KDIGO: explicación del Velocímetro Renal',
    desc: 'Qué es la TFG, cómo se calcula con CKD-EPI 2021 (creatinina y cistatina C), los estadios G1 a G5 de la enfermedad renal crónica, las categorías de albuminuria A1 a A3 y la cuadrícula de riesgo KDIGO 2024, en texto y con referencias.',
    cred: 'Médico nefrólogo',
    logosub: 'Explicación en texto · TFG · KDIGO 2024 · CKD-EPI 2021',
    volver: '← Ir a la calculadora',
    autor: 'Autor: Juan José Jaller, médico nefrólogo · Responsable del sitio: CiMedical · Actualizada el',
    otro: 'Read this page in English',
    intro: c => `Esta página explica, en texto, lo mismo que muestra la <a href="${c}">calculadora del Velocímetro Renal</a>:
      qué es la tasa de filtración glomerular (TFG), cómo se calcula, en qué estadio de enfermedad renal crónica
      queda cada valor, cómo se clasifica la albuminuria y cómo se cruzan las dos en la cuadrícula de riesgo de
      KDIGO. Los rangos y las fórmulas son exactamente los que usa la calculadora.`,
    aviso: 'Herramienta de apoyo para la consulta. La interpretación corresponde al médico tratante. No es una herramienta de autodiagnóstico.',
    contenido: 'Contenido',
    indice: ['Qué es el Velocímetro Renal', 'Qué es la TFG', 'Cómo se calcula: CKD-EPI 2021', 'Estadios G1 a G5',
      'Albuminuria A1 a A3', 'Cuadrícula de riesgo KDIGO', 'Cómo usarlo en consulta', 'Privacidad',
      'Preguntas frecuentes', 'Referencias'],
    hQue: 'Qué es el Velocímetro Renal',
    pQue: c => `El Velocímetro Renal (<a href="${c}">velocimetrorenal.com</a>) es una herramienta web gratuita para que el
        médico le explique al paciente, en la consulta, su función renal y su riesgo de progresión de enfermedad
        renal crónica. La pantalla le habla al paciente con una comparación sencilla: así como un carro tiene
        velocímetro, los riñones tienen su propia «velocidad», la tasa de filtración glomerular. Entre más alta,
        mejor funciona el riñón. Está disponible en español y en inglés.`,
    pCinco: 'La herramienta hace cinco cosas:',
    cinco: [
      'Muestra la TFG como la aguja de un velocímetro sobre los estadios G1 a G5 de KDIGO.',
      'Calcula la TFG con la fórmula CKD-EPI 2021 (creatinina, o creatinina y cistatina C), sin variable de raza.',
      'Clasifica la albuminuria en A1, A2 o A3 según la relación albúmina/creatinina en orina.',
      'Ubica al paciente en la cuadrícula de riesgo KDIGO (TFG × albuminuria), con el nivel de riesgo y la frecuencia de control anual de su casilla.',
      'Genera una hoja para el paciente, para imprimir o guardar en PDF.',
    ],
    hTfg: 'Qué es la TFG',
    pTfg1: 'La tasa de filtración glomerular (TFG; en inglés GFR, y eGFR cuando es estimada) es la medida de qué tan bien filtran los riñones. Se expresa en mL/min/1,73 m². En el velocímetro, la aguja se mueve a la derecha cuanto mejor filtra el riñón; la escala va de 0 a 120.',
    pTfg2: 'El pronóstico del riñón no depende solo de la TFG: la albuminuria pesa igual. Por eso la herramienta pide los dos valores y los cruza en la <a href="#riesgo">cuadrícula de riesgo</a>.',
    hEpi: 'Cómo se calcula: CKD-EPI 2021',
    pEpi: 'Si no se tiene la TFG, la herramienta la estima con las ecuaciones CKD-EPI 2021 (Inker y colaboradores, N Engl J Med 2021), que no usan la variable de raza. Hay dos versiones.',
    hCr: 'Solo creatinina',
    fCr: 'TFG = 142 × mín(Cr/κ, 1)<sup>α</sup> × máx(Cr/κ, 1)<sup>−1,200</sup> × 0,9938<sup>edad</sup> × 1,012 (si es mujer)',
    lCr: ['Cr: creatinina sérica en mg/dL. Edad en años.', 'κ: 0,7 en mujeres y 0,9 en hombres.', 'α: −0,241 en mujeres y −0,302 en hombres.'],
    hCys: 'Creatinina y cistatina C',
    fCys: 'TFG = 135 × mín(Cr/κ, 1)<sup>α</sup> × máx(Cr/κ, 1)<sup>−0,544</sup> × mín(Cis/0,8, 1)<sup>−0,323</sup> × máx(Cis/0,8, 1)<sup>−0,778</sup> × 0,9961<sup>edad</sup> × 0,963 (si es mujer)',
    lCys: ['Cis: cistatina C sérica en mg/L.', 'κ: 0,7 en mujeres y 0,9 en hombres.', 'α: −0,219 en mujeres y −0,144 en hombres.'],
    hEj: 'Ejemplos',
    ej1: (cr, t, e) => `Hombre de ${EJ1.edad} años con creatinina de ${cr} mg/dL (solo creatinina): TFG de ${t} mL/min/1,73 m², estadio ${e}.`,
    ej2: (cr, cy, t, e) => `Mujer de ${EJ2.edad} años con creatinina de ${cr} mg/dL y cistatina C de ${cy} mg/L: TFG de ${t} mL/min/1,73 m², estadio ${e}.`,
    pRedondeo: 'La calculadora redondea el resultado a un decimal y acepta edades desde los 18 años.',
    hEst: 'Estadios de enfermedad renal crónica según la TFG (G1 a G5)',
    thEst: ['Estadio', 'TFG (mL/min/1,73 m²)', 'Nombre', 'Qué significa'],
    pG1G2: 'G1 y G2 con albuminuria A1 solo se consideran enfermedad renal crónica si existe otro marcador de daño renal.',
    hAlb: 'Categorías de albuminuria (A1 a A3)',
    pAlb: 'La albuminuria se mide como relación albúmina/creatinina en una muestra de orina (RAC; en inglés uACR), en mg/g.',
    thAlb: ['Categoría', 'uACR', 'Nombre', 'Qué significa'],
    hRiesgo: 'Cuadrícula de riesgo KDIGO (TFG × albuminuria)',
    pRiesgo: 'La cuadrícula cruza el estadio de TFG con la categoría de albuminuria. Cada casilla da el nivel de riesgo de progresión y el número de controles de función renal recomendados al año.',
    thRiesgo: 'TFG ↓ · Albuminuria →',
    pTexto: 'La misma cuadrícula, en texto:',
    liRiesgo: (k, rango, partes) => `<strong>${k}</strong> (TFG ${rango}): ${partes.join('; ')}.`,
    parte: (a, nivel, v) => `con ${a}, riesgo ${nivel.toLowerCase()} (${v})`,
    p4mas: '«4+» significa cuatro o más controles al año.',
    hUso: 'Cómo usarlo en consulta',
    uso: [
      'Si ya tiene la TFG y la albuminuria (RAC / uACR) del paciente, ingréselas directamente.',
      'Si necesita calcular la TFG, abra «Calcular TFG con CKD-EPI 2021», ingrese creatinina, edad y sexo (opcionalmente cistatina C) y pulse «Calcular».',
      'El velocímetro muestra al paciente dónde está su función renal: la aguja se mueve a la derecha cuanto mejor filtra el riñón.',
      'Con TFG y albuminuria, la cuadrícula KDIGO resalta la casilla del paciente y su riesgo de progresión; úsela para explicar por qué la albuminuria pesa tanto como la TFG.',
      'Al final, «Imprimir hoja para paciente» genera un resumen en blanco y negro para entregar, con espacio opcional para el nombre del paciente y el del médico.',
    ],
    abrir: 'Abrir la calculadora →',
    hPriv: 'Privacidad',
    pPriv: c => `Todo el cálculo ocurre en el navegador. La TFG, la albuminuria, la creatinina, la cistatina C, la edad y
        el sexo no se envían a ningún servidor, no se guardan y desaparecen al cerrar o recargar la página. No hay
        cookies ni publicidad. El detalle está en la «Política de uso de datos», al pie de la
        <a href="${c}">calculadora</a>.`,
    hFaq: 'Preguntas frecuentes',
    faq: (est, alb) => [
      ['¿Qué es el Velocímetro Renal?',
        'Es una herramienta web gratuita para que el médico le explique al paciente, en la consulta, cómo está su función renal. Muestra la tasa de filtración glomerular (TFG) como la aguja de un velocímetro sobre los estadios G1 a G5 de KDIGO, clasifica la albuminuria (A1 a A3) y ubica al paciente en la cuadrícula de riesgo KDIGO.'],
      ['¿Qué fórmula usa para calcular la TFG?',
        'CKD-EPI 2021, con creatinina sola o con creatinina y cistatina C. Son las ecuaciones publicadas por Inker y colaboradores en el New England Journal of Medicine en 2021. No usan la variable de raza.'],
      ['¿Qué datos se necesitan para calcular la TFG?',
        'Sexo, edad en años y creatinina sérica en mg/dL. De forma opcional, cistatina C en mg/L. Si ya se conoce la TFG, se puede escribir directamente sin calcularla.'],
      ['¿Cuáles son los estadios de la enfermedad renal crónica según la TFG?',
        est + '. G1 y G2 con albuminuria A1 solo se consideran enfermedad renal crónica si existe otro marcador de daño renal.'],
      ['¿Cómo se clasifica la albuminuria?',
        alb + '. Se mide como relación albúmina/creatinina en orina (RAC o uACR).'],
      ['¿Qué es la cuadrícula de riesgo KDIGO?',
        'Es una tabla que cruza el estadio de TFG (G1 a G5) con la categoría de albuminuria (A1 a A3). Cada casilla indica el riesgo de progresión (bajo, moderado, alto o muy alto) y cuántos controles de función renal se recomiendan al año. Muestra que la albuminuria pesa tanto como la TFG en el pronóstico.'],
      ['¿El Velocímetro Renal guarda los datos del paciente?',
        'No. Todo el cálculo ocurre en el navegador. Los valores no se envían a ningún servidor, no se guardan y desaparecen al cerrar o recargar la página. No usa cookies ni publicidad.'],
      ['¿Sirve para autodiagnóstico?',
        'No. Es una herramienta de apoyo para la consulta. La interpretación corresponde al médico tratante.'],
      ['¿En qué idiomas está?', 'En español y en inglés. Se cambia con el interruptor ES | EN de la cabecera.'],
      ['¿Cuánto cuesta?', 'Es gratuito y no tiene publicidad.'],
    ],
    faqEst: (k, s) => `${k}: TFG ${s.range} mL/min/1,73 m² (${s.name.toLowerCase()})`,
    hRefs: 'Referencias',
    ref1: ['Guía completa ↗', '(estadios, albuminuria y cuadrícula de riesgo).'],
    ref2: '(cálculo de la TFG).',
    pro: '<strong>Herramienta de uso profesional.</strong> Diseñada para que el médico explique al paciente su enfermedad renal y su riesgo de progresión. La interpretación corresponde al médico tratante.',
    pie: c => `<a href="${c}">Calculadora</a> · Guías <strong>KDIGO 2024</strong> · Fórmula <strong>CKD-EPI 2021</strong> · Responsable del sitio: <strong>CiMedical</strong><br>Del mismo autor: <a href="https://nefrona-interactiva.com/?lang=es">Nefrona Interactiva</a>, fisiología renal en animaciones`,
    condicion: 'Enfermedad renal crónica',
    pruebas: ['Tasa de filtración glomerular estimada', 'Relación albúmina/creatinina en orina'],
  },

  en: {
    archivo: 'gfr-chronic-kidney-disease.html',
    calc: './?lang=en',
    num: n => String(n),
    unidad: 'mL/min/1.73 m²',
    fecha: `${MESES_EN[MM - 1]} ${DD}, ${AA}`,
    locale: 'en_US',
    estadio: k => Object.assign({}, porClave[k], D.VR_DATOS_EN.estadios[k]),
    alb: a => Object.assign({}, a, D.VR_DATOS_EN.albuminuria[a.key]),
    riesgo: k => D.VR_DATOS_EN.riesgo[k],
    veces: f => (f === 1 ? '1 check-up per year' : `${f} check-ups per year`),
    tituloPag: 'GFR, albuminuria and KDIGO risk: explanation in text — Velocímetro Renal (Kidney Speedometer)',
    titulo: 'Glomerular filtration rate (GFR), albuminuria and KDIGO risk: the Kidney Speedometer explained',
    desc: 'What GFR is, how it is calculated with CKD-EPI 2021 (creatinine and cystatin C), the G1 to G5 stages of chronic kidney disease, the A1 to A3 albuminuria categories and the KDIGO 2024 risk grid, in plain text and with references.',
    cred: 'Nephrologist',
    logosub: 'Explanation in text · GFR · KDIGO 2024 · CKD-EPI 2021',
    volver: '← Go to the calculator',
    autor: 'Author: Juan José Jaller, MD, nephrologist · Site owner: CiMedical · Updated on',
    otro: 'Leer esta página en español',
    intro: c => `This page explains, in text, the same things shown by the <a href="${c}">Velocímetro Renal (Kidney Speedometer) calculator</a>:
      what the glomerular filtration rate (GFR) is, how it is calculated, which stage of chronic kidney disease
      each value falls into, how albuminuria is classified and how the two are combined in the KDIGO risk grid.
      The ranges and formulas are exactly the ones the calculator uses.`,
    aviso: 'A support tool for the consultation. Interpretation is the responsibility of the treating physician. It is not a self-diagnosis tool.',
    contenido: 'Contents',
    indice: ['What the Kidney Speedometer is', 'What GFR is', 'How it is calculated: CKD-EPI 2021', 'Stages G1 to G5',
      'Albuminuria A1 to A3', 'KDIGO risk grid', 'How to use it during the visit', 'Privacy',
      'Frequently asked questions', 'References'],
    hQue: 'What the Kidney Speedometer is',
    pQue: c => `Velocímetro Renal, Spanish for “Kidney Speedometer” (<a href="${c}">velocimetrorenal.com</a>), is a free web tool
        for the physician to explain to the patient, during the visit, their kidney function and their risk of
        progression of chronic kidney disease. The screen speaks to the patient with a simple comparison: just as
        a car has a speedometer, the kidneys have their own “speed”, the glomerular filtration rate. The higher it
        is, the better the kidney works. It is available in Spanish and in English.`,
    pCinco: 'The tool does five things:',
    cinco: [
      'It shows GFR as the needle of a speedometer over the KDIGO stages G1 to G5.',
      'It calculates GFR with the CKD-EPI 2021 formula (creatinine, or creatinine and cystatin C), without the race variable.',
      'It classifies albuminuria as A1, A2 or A3 according to the urine albumin-to-creatinine ratio.',
      'It places the patient on the KDIGO risk grid (GFR × albuminuria), with the level of risk and the yearly check-up frequency for their cell.',
      'It produces a handout for the patient, to print or save as a PDF.',
    ],
    hTfg: 'What GFR is',
    pTfg1: 'The glomerular filtration rate (GFR; eGFR when it is estimated; TFG in Spanish) is the measure of how well the kidneys filter. It is expressed in mL/min/1.73 m². On the speedometer, the needle moves to the right the better the kidney filters; the scale goes from 0 to 120.',
    pTfg2: 'The outlook for the kidney does not depend on GFR alone: albuminuria weighs just as much. That is why the tool asks for both values and combines them in the <a href="#riesgo">risk grid</a>.',
    hEpi: 'How it is calculated: CKD-EPI 2021',
    pEpi: 'If the GFR is not available, the tool estimates it with the CKD-EPI 2021 equations (Inker et al., N Engl J Med 2021), which do not use the race variable. There are two versions.',
    hCr: 'Creatinine only',
    fCr: 'GFR = 142 × min(Cr/κ, 1)<sup>α</sup> × max(Cr/κ, 1)<sup>−1.200</sup> × 0.9938<sup>age</sup> × 1.012 (if female)',
    lCr: ['Cr: serum creatinine in mg/dL. Age in years.', 'κ: 0.7 for women and 0.9 for men.', 'α: −0.241 for women and −0.302 for men.'],
    hCys: 'Creatinine and cystatin C',
    fCys: 'GFR = 135 × min(Cr/κ, 1)<sup>α</sup> × max(Cr/κ, 1)<sup>−0.544</sup> × min(Cys/0.8, 1)<sup>−0.323</sup> × max(Cys/0.8, 1)<sup>−0.778</sup> × 0.9961<sup>age</sup> × 0.963 (if female)',
    lCys: ['Cys: serum cystatin C in mg/L.', 'κ: 0.7 for women and 0.9 for men.', 'α: −0.219 for women and −0.144 for men.'],
    hEj: 'Examples',
    ej1: (cr, t, e) => `A ${EJ1.edad}-year-old man with a creatinine of ${cr} mg/dL (creatinine only): GFR of ${t} mL/min/1.73 m², stage ${e}.`,
    ej2: (cr, cy, t, e) => `A ${EJ2.edad}-year-old woman with a creatinine of ${cr} mg/dL and a cystatin C of ${cy} mg/L: GFR of ${t} mL/min/1.73 m², stage ${e}.`,
    pRedondeo: 'The calculator rounds the result to one decimal place and accepts ages from 18 years.',
    hEst: 'Stages of chronic kidney disease by GFR (G1 to G5)',
    thEst: ['Stage', 'GFR (mL/min/1.73 m²)', 'Name', 'What it means'],
    pG1G2: 'G1 and G2 with albuminuria A1 are only considered chronic kidney disease if another marker of kidney damage is present.',
    hAlb: 'Albuminuria categories (A1 to A3)',
    pAlb: 'Albuminuria is measured as the albumin-to-creatinine ratio in a urine sample (uACR), in mg/g.',
    thAlb: ['Category', 'uACR', 'Name', 'What it means'],
    hRiesgo: 'KDIGO risk grid (GFR × albuminuria)',
    pRiesgo: 'The grid crosses the GFR stage with the albuminuria category. Each cell gives the level of risk of progression and the recommended number of kidney function check-ups per year.',
    thRiesgo: 'GFR ↓ · Albuminuria →',
    pTexto: 'The same grid, in text:',
    liRiesgo: (k, rango, partes) => `<strong>${k}</strong> (GFR ${rango}): ${partes.join('; ')}.`,
    parte: (a, nivel, v) => `with ${a}, ${nivel.toLowerCase()} risk (${v})`,
    p4mas: '“4+” means four or more check-ups per year.',
    hUso: 'How to use it during the visit',
    uso: [
      'If you already have the patient\'s GFR and albuminuria (uACR), enter them directly.',
      'If you need to calculate the GFR, open “Calculate GFR with CKD-EPI 2021”, enter creatinine, age and sex (optionally cystatin C) and press “Calculate”.',
      'The speedometer shows the patient where their kidney function stands: the needle moves to the right the better the kidney filters.',
      'With GFR and albuminuria, the KDIGO grid highlights the patient\'s cell and their risk of progression; use it to explain why albuminuria weighs as much as GFR.',
      'Finally, “Print patient handout” produces a black-and-white summary to hand over, with optional space for the patient\'s name and the physician\'s.',
    ],
    abrir: 'Open the calculator →',
    hPriv: 'Privacy',
    pPriv: c => `All the calculation happens in the browser. GFR, albuminuria, creatinine, cystatin C, age and sex are
        not sent to any server, are not stored and disappear when the page is closed or reloaded. There are no
        cookies and no advertising. The details are in the “Data use policy” at the foot of the
        <a href="${c}">calculator</a>.`,
    hFaq: 'Frequently asked questions',
    faq: (est, alb) => [
      ['What is Velocímetro Renal (the Kidney Speedometer)?',
        'It is a free web tool for the physician to explain to the patient, during the visit, how their kidney function is doing. It shows the glomerular filtration rate (GFR) as the needle of a speedometer over the KDIGO stages G1 to G5, classifies albuminuria (A1 to A3) and places the patient on the KDIGO risk grid.'],
      ['Which formula does it use to calculate GFR?',
        'CKD-EPI 2021, with creatinine alone or with creatinine and cystatin C. These are the equations published by Inker and colleagues in the New England Journal of Medicine in 2021. They do not use the race variable.'],
      ['What data are needed to calculate GFR?',
        'Sex, age in years and serum creatinine in mg/dL. Optionally, cystatin C in mg/L. If the GFR is already known, it can be typed in directly without calculating it.'],
      ['What are the stages of chronic kidney disease by GFR?',
        est + '. G1 and G2 with albuminuria A1 are only considered chronic kidney disease if another marker of kidney damage is present.'],
      ['How is albuminuria classified?',
        alb + '. It is measured as the urine albumin-to-creatinine ratio (uACR).'],
      ['What is the KDIGO risk grid?',
        'It is a table that crosses the GFR stage (G1 to G5) with the albuminuria category (A1 to A3). Each cell indicates the risk of progression (low, moderate, high or very high) and how many kidney function check-ups are recommended per year. It shows that albuminuria weighs as much as GFR in the outlook.'],
      ['Does the Kidney Speedometer store patient data?',
        'No. All the calculation happens in the browser. The values are not sent to any server, are not stored and disappear when the page is closed or reloaded. It uses no cookies and no advertising.'],
      ['Is it meant for self-diagnosis?',
        'No. It is a support tool for the consultation. Interpretation is the responsibility of the treating physician.'],
      ['Which languages is it available in?', 'Spanish and English. Use the ES | EN switch in the header.'],
      ['How much does it cost?', 'It is free and has no advertising.'],
    ],
    faqEst: (k, s) => `${k}: GFR ${s.range} mL/min/1.73 m² (${s.name.toLowerCase()})`,
    hRefs: 'References',
    ref1: ['Full guideline ↗', '(stages, albuminuria and risk grid).'],
    ref2: '(GFR calculation).',
    pro: '<strong>Tool for professional use.</strong> Designed for the physician to explain to the patient their kidney disease and their risk of progression. Interpretation is the responsibility of the treating physician.',
    pie: c => `<a href="${c}">Calculator</a> · <strong>KDIGO 2024</strong> guidelines · <strong>CKD-EPI 2021</strong> formula · Site owner: <strong>CiMedical</strong><br>By the same author: <a href="https://nefrona-interactiva.com/?lang=en">Nefrona Interactiva</a>, renal physiology in animations`,
    condicion: 'Chronic kidney disease',
    pruebas: ['Estimated glomerular filtration rate', 'Urine albumin-to-creatinine ratio'],
  },
};

const IDS = ['que-es', 'tfg', 'ckd-epi', 'estadios', 'albuminuria', 'riesgo', 'uso', 'privacidad', 'preguntas', 'referencias'];

function pagina(l) {
  const T = L[l];
  const otro = l === 'es' ? 'en' : 'es';
  const URL_GUIA = SITIO + T.archivo;
  const c = T.calc;
  const una = n => T.num(Math.round(n * 10) / 10);

  const filasEstadios = ORDEN.map(k => {
    const s = T.estadio(k);
    return `          <tr><th scope="row">${k}</th><td>${esc(s.range)}</td><td>${esc(s.name)}</td><td>${esc(s.description)}</td></tr>`;
  }).join('\n');

  const albs = D.ALB_STAGES.map(T.alb);
  const filasAlb = albs.map(a =>
    `          <tr><th scope="row">${a.key}</th><td>${esc(a.range)}</td><td>${esc(a.name)}</td><td>${esc(a.desc)}</td></tr>`
  ).join('\n');

  const filasRiesgo = ORDEN.map(k => {
    const celdas = D.RISK_MATRIX[k].map((nivel, i) =>
      `<td class="gt-r-${nivel}"><strong>${esc(T.riesgo(nivel))}</strong><br>${T.veces(D.MONITOR_FREQ[k][i])}</td>`).join('');
    return `          <tr><th scope="row">${k}<br><span class="gt-sub">${esc(porClave[k].range)} ${T.unidad}</span></th>${celdas}</tr>`;
  }).join('\n');

  const listaRiesgo = ORDEN.map(k => {
    const partes = D.RISK_MATRIX[k].map((nivel, i) =>
      T.parte(albs[i].key, T.riesgo(nivel), T.veces(D.MONITOR_FREQ[k][i])));
    return `        <li>${T.liRiesgo(k, esc(porClave[k].range), partes)}</li>`;
  }).join('\n');

  const FAQ = T.faq(
    ORDEN.map(k => T.faqEst(k, T.estadio(k))).join('; '),
    albs.map(a => `${a.key}: ${a.range} (${a.name.toLowerCase()})`).join('; '));
  const faqHtml = FAQ.map(([p, r]) => `      <h3>${esc(p)}</h3>\n      <p>${esc(r)}</p>`).join('\n');

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': ['MedicalWebPage', 'LearningResource'],
      '@id': URL_GUIA,
      url: URL_GUIA,
      name: T.titulo,
      headline: T.titulo,
      description: T.desc,
      inLanguage: l,
      datePublished: '2026-11-25',
      dateModified: HOY,
      isAccessibleForFree: true,
      author: { '@type': 'Person', name: 'Juan José Jaller', jobTitle: T.cred },
      publisher: { '@type': 'Organization', name: 'CiMedical' },
      audience: { '@type': 'MedicalAudience', audienceType: 'Clinician' },
      about: [
        { '@type': 'MedicalCondition', name: T.condicion },
        { '@type': 'MedicalTest', name: T.pruebas[0], alternateName: ['TFG', 'GFR', 'eGFR', 'CKD-EPI 2021'] },
        { '@type': 'MedicalTest', name: T.pruebas[1], alternateName: ['RAC', 'uACR', 'Albuminuria'] },
      ],
      isPartOf: { '@id': SITIO + '#sitio' },
      image: SITIO + 'img/og.png',
      workTranslation: { '@id': SITIO + L[otro].archivo },
      citation: [
        'KDIGO CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.',
        'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749. doi:10.1056/NEJMoa2102953',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: l,
      mainEntity: FAQ.map(([p, r]) => ({
        '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r },
      })),
    },
  ];

  const li = arr => arr.map(x => `          <li>${x}</li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="${l}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- GENERADA por tools/generar-guia.js a partir de app.js e i18n.js. No editar a mano. -->
  <title>${esc(T.tituloPag)}</title>
  <meta name="description" content="${esc(T.desc)}" />
  <link rel="canonical" href="${URL_GUIA}" />
  <link rel="alternate" hreflang="es" href="${SITIO}${L.es.archivo}" />
  <link rel="alternate" hreflang="en" href="${SITIO}${L.en.archivo}" />
  <link rel="alternate" hreflang="x-default" href="${SITIO}${L.en.archivo}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Velocímetro Renal" />
  <meta property="og:title" content="${esc(T.titulo)}" />
  <meta property="og:description" content="${esc(T.desc)}" />
  <meta property="og:url" content="${URL_GUIA}" />
  <meta property="og:locale" content="${T.locale}" />
  <meta property="og:image" content="${SITIO}img/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="img/icono.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css?v=${VER_CSS}" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>

  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="${c}">
        <svg class="logo-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <ellipse cx="14" cy="20" rx="8" ry="13" stroke="#2563eb" stroke-width="2.5" fill="none" opacity="0.7"/>
          <ellipse cx="26" cy="20" rx="8" ry="13" stroke="#2563eb" stroke-width="2.5" fill="none"/>
        </svg>
        <div>
          <div class="logo-title">Velocímetro Renal</div>
          <div class="logo-sub">${T.logosub}</div>
        </div>
      </a>
      <nav class="header-right">
        <a class="header-link header-info sin-icono" href="${c}">${T.volver}</a>
        <div class="lang-switch" role="group" aria-label="Idioma / Language" title="Idioma / Language">
          <a class="${l === 'es' ? 'activo' : ''}" href="${L.es.archivo}" hreflang="es" lang="es">ES</a>
          <a class="${l === 'en' ? 'activo' : ''}" href="${L.en.archivo}" hreflang="en" lang="en">EN</a>
        </div>
      </nav>
    </div>
  </header>

  <main class="gt-main">
    <article class="card gt">
      <h1 class="gt-titulo">${esc(T.titulo)}</h1>
      <p class="gt-fecha">${T.autor} <time datetime="${HOY}">${T.fecha}</time> · <a href="${L[otro].archivo}" hreflang="${otro}" lang="${otro}">${L[l].otro}</a></p>
      <p>${T.intro(c)}</p>
      <p class="gt-aviso">${T.aviso}</p>

      <nav class="gt-indice" aria-label="${T.contenido}">
        <h2>${T.contenido}</h2>
        <ol>
${T.indice.map((t, i) => `          <li><a href="#${IDS[i]}">${t}</a></li>`).join('\n')}
        </ol>
      </nav>

      <section id="que-es">
        <h2>${T.hQue}</h2>
        <p>${T.pQue(c)}</p>
        <p>${T.pCinco}</p>
        <ul>
${li(T.cinco)}
        </ul>
      </section>

      <section id="tfg">
        <h2>${T.hTfg}</h2>
        <p>${T.pTfg1}</p>
        <p>${T.pTfg2}</p>
      </section>

      <section id="ckd-epi">
        <h2>${T.hEpi}</h2>
        <p>${T.pEpi}</p>

        <h3>${T.hCr}</h3>
        <p class="gt-formula">${T.fCr}</p>
        <ul>
${li(T.lCr)}
        </ul>

        <h3>${T.hCys}</h3>
        <p class="gt-formula">${T.fCys}</p>
        <ul>
${li(T.lCys)}
        </ul>

        <h3>${T.hEj}</h3>
        <ul>
          <li>${T.ej1(T.num(EJ1.cr), una(tfg1), est1)}</li>
          <li>${T.ej2(T.num(EJ2.cr), T.num(EJ2.cys), una(tfg2), est2)}</li>
        </ul>
        <p>${T.pRedondeo}</p>
      </section>

      <section id="estadios">
        <h2>${T.hEst}</h2>
        <div class="gt-tabla-wrap">
        <table class="gt-tabla">
          <thead><tr>${T.thEst.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
          <tbody>
${filasEstadios}
          </tbody>
        </table>
        </div>
        <p>${T.pG1G2}</p>
      </section>

      <section id="albuminuria">
        <h2>${T.hAlb}</h2>
        <p>${T.pAlb}</p>
        <div class="gt-tabla-wrap">
        <table class="gt-tabla">
          <thead><tr>${T.thAlb.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
          <tbody>
${filasAlb}
          </tbody>
        </table>
        </div>
      </section>

      <section id="riesgo">
        <h2>${T.hRiesgo}</h2>
        <p>${T.pRiesgo}</p>
        <div class="gt-tabla-wrap">
        <table class="gt-tabla gt-riesgo">
          <thead><tr><th scope="col">${T.thRiesgo}</th>${albs.map(a => `<th scope="col">${a.key}<br><span class="gt-sub">${esc(a.range)}</span></th>`).join('')}</tr></thead>
          <tbody>
${filasRiesgo}
          </tbody>
        </table>
        </div>
        <p>${T.pTexto}</p>
        <ul>
${listaRiesgo}
        </ul>
        <p>${T.p4mas}</p>
      </section>

      <section id="uso">
        <h2>${T.hUso}</h2>
        <ol class="gt-pasos">
${li(T.uso)}
        </ol>
        <p><a href="${c}"><strong>${T.abrir}</strong></a></p>
      </section>

      <section id="privacidad">
        <h2>${T.hPriv}</h2>
        <p>${T.pPriv(c)}</p>
      </section>

      <section id="preguntas">
        <h2>${T.hFaq}</h2>
${faqHtml}
      </section>

      <section id="referencias">
        <h2>${T.hRefs}</h2>
        <ol class="gt-refs">
          <li>Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. <em>KDIGO 2024 Clinical Practice
          Guideline for the Evaluation and Management of Chronic Kidney Disease.</em> Kidney Int.
          2024;105(4S):S117–S314. <a href="https://kdigo.org/guidelines/ckd-evaluation-and-management/" target="_blank" rel="noopener">${T.ref1[0]}</a>
          ${T.ref1[1]}</li>
          <li>Inker LA, Eneanya ND, Coresh J, et al. <em>New creatinine- and cystatin C–based equations to estimate
          GFR without race.</em> N Engl J Med. 2021;385(19):1737–1749.
          <a href="https://doi.org/10.1056/NEJMoa2102953" target="_blank" rel="noopener">doi:10.1056/NEJMoa2102953 ↗</a>
          ${T.ref2}</li>
        </ol>
      </section>
    </article>
  </main>

  <footer class="site-footer">
    <p class="pro-notice">
      ${T.pro}
    </p>
    <p>${T.pie(c)}</p>
  </footer>

  <!-- Analítica sin cookies ni IP (GoatCounter): cuenta visitas únicas, no identifica personas -->
  <script data-goatcounter="https://velocimetrorenal.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
`;
}

for (const l of ['es', 'en']) {
  const html = pagina(l);
  fs.writeFileSync(path.join(RAIZ, L[l].archivo), html);
  const texto = html.slice(html.indexOf('<main')).replace(/<[^>]+>/g, ' ');
  console.log(L[l].archivo, '·', texto.split(/\s+/).length, 'palabras');
}
console.log(`Ejemplo 1: ${Math.round(tfg1 * 10) / 10} (${est1}) · Ejemplo 2: ${Math.round(tfg2 * 10) / 10} (${est2})`);
