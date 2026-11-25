# Velocímetro Renal

**https://velocimetrorenal.com**

Herramienta web para que el médico explique al paciente, en consulta, su función renal
y su riesgo de progresión de enfermedad renal crónica. La pantalla le habla al paciente
("¿a qué velocidad trabaja tu riñón?"); la interpretación corresponde al médico tratante.

Responsable del sitio: **CiMedical**.

## Qué hace

- **Velocímetro de TFG** con aguja sobre los estadios G1–G5 (KDIGO).
- **Cálculo de TFG** con CKD-EPI 2021 (creatinina, o creatinina + cistatina C), sin variable de raza.
- **Clasificación de albuminuria** A1/A2/A3 por uACR.
- **Cuadrícula de riesgo KDIGO (TFG × albuminuria)**: tabla de calor 6×3 con nivel de riesgo
  y frecuencia de control anual por casilla; resalta la casilla del paciente.
- **Hoja para el paciente** (imprimir / guardar PDF): velocímetro en escala de grises, TFG,
  estadio, albuminuria, riesgo combinado, campos opcionales de nombre del paciente y del médico
  (quedan en blanco para escribir a mano si no se llenan).
- **Referencias** y **política de uso de datos** al pie.

## Privacidad

Todo el cálculo ocurre en el navegador. Los valores clínicos no se envían a ningún servidor,
no se guardan y desaparecen al recargar. No hay cookies, almacenamiento local, publicidad ni
rastreo. Al cargar la página, la IP del visitante es visible para GitHub Pages (alojamiento),
Google Fonts (tipografías), hits.sh (contador de visitas) y GoatCounter (analítica sin cookies
ni IP; servidores en la UE; panel en https://velocimetrorenal.goatcounter.com). Detalle en el desplegable
"Política de uso de datos" de la propia página. Marco: Ley 1581 de 2012 (Colombia).

## Referencias

- KDIGO CKD Work Group. *KDIGO 2024 Clinical Practice Guideline for the Evaluation and
  Management of Chronic Kidney Disease.* Kidney Int. 2024;105(4S):S117–S314.
  https://kdigo.org/guidelines/ckd-evaluation-and-management/
- Inker LA, Eneanya ND, Coresh J, et al. *New creatinine- and cystatin C–based equations to
  estimate GFR without race.* N Engl J Med. 2021;385(19):1737–1749.
  https://doi.org/10.1056/NEJMoa2102953

## Estructura

```
index.html   la calculadora: estructura y textos (incluye la sección oculta para impresión)
style.css    estilos de pantalla, de la guía en texto y @media print
app.js       cálculo CKD-EPI, velocímetro (canvas), cuadrícula KDIGO, impresión
tfg-enfermedad-renal-cronica.html
             guía en texto («Más información») — GENERADA, no editar a mano
tools/generar-guia.js   genera la guía leyendo estadios, albuminuria, cuadrícula y fórmulas de app.js
robots.txt · sitemap.xml · llms.txt   para buscadores y asistentes de IA
img/og.png · img/icono.svg            vista previa al compartir e icono de pestaña
qr/          códigos QR del dominio para presentaciones
CNAME        dominio personalizado para GitHub Pages
```

Sin framework, sin dependencias ni paso de compilación. Se abre directamente `index.html`
en el navegador para probar en local.

## Buscadores y asistentes de IA

- **Guía en texto** (`tfg-enfermedad-renal-cronica.html`): qué es la TFG, las dos ecuaciones CKD-EPI 2021
  con coeficientes y ejemplos, estadios G1–G5, albuminuria A1–A3, la cuadrícula de riesgo completa, uso en
  consulta, preguntas frecuentes y referencias. Se llega por el botón **«📖 Más información»** de la cabecera
  y por un enlace bajo «¿Cómo usar esta herramienta en consulta?».
- La guía **se genera**: `node tools/generar-guia.js`. Lee los datos de `app.js`, así que nunca dice algo
  distinto de la calculadora. **Correrlo cada vez que cambien rangos, textos de estadios o fórmulas en `app.js`.**
  Los textos fijos de la guía (introducciones, preguntas frecuentes) están dentro del propio generador.
- Cada página lleva canónica, Open Graph (`img/og.png`, 1200×630), icono y datos estructurados JSON-LD
  (`WebSite` + `WebApplication`/`MedicalWebPage` en la calculadora; `MedicalWebPage` + `FAQPage` en la guía).
- `robots.txt` permite todos los buscadores y, de forma explícita, los robots de IA. `sitemap.xml` lista las
  dos páginas (actualizar `lastmod` y añadir páginas nuevas). `llms.txt` es el resumen para asistentes de IA.
- Google Search Console: la etiqueta `google-site-verification` de `index.html` es la que verifica la
  propiedad. **No borrar esa línea.**
- `style.css` se enlaza con `?v=N`; subir el número cuando cambie, para que el navegador no sirva la copia vieja.

## Publicación

- **GitHub Pages** desde la rama `main`. **Cada push a `main` actualiza el sitio en vivo
  en ~1 minuto; no hay ambiente de pruebas.** Revisar en local antes de subir.
- Dominio `velocimetrorenal.com` registrado en GoDaddy (renovación anual, septiembre).
- DNS (en GoDaddy):
  - `A @` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `CNAME www` → `jalzam.github.io`
  - `CNAME _domainconnect` → intacto (servicio interno de GoDaddy)
- HTTPS forzado; certificado Let's Encrypt emitido y renovado por GitHub.
- `https://jalzam.github.io/nefro-velocimetro/` redirige al dominio.
- Analítica: GoatCounter (`gc.zgo.at/count.js`), visitas únicas por sesión de 8 h, sin cookies.
  - Eventos de uso (`registrarCalculo()` en `app.js`): `calculo/tfg-directa` (botón o Enter) y
    `calculo/ckd-epi` (fórmula), con `no_session: true` para contar cada cálculo y no uno por
    sesión. Solo viaja el nombre del evento, nunca los valores. Las tarjetas de
    ejemplo de etapa no cuentan. En el panel de GoatCounter aparecen bajo "Events".
- Contador de visitas: badge de `hits.sh` con clave `velocimetrorenal.com` (gratis, sin
  cuenta ni API key; sin CORS, por eso va como `<img>`). Reemplazó a counterapi.dev v1,
  descontinuada (HTTP 410).

## Decisiones

- **Sin publicidad.** Se evaluó AdSense y se descartó: no controlar qué anuncios aparecen junto
  a información clínica compromete la credibilidad y puede perjudicar al paciente.
- Uso médico en consulta, no herramienta de autodiagnóstico.
- Certificado gratuito de Let's Encrypt; no se compra SSL (GitHub Pages no acepta externos).

## Historial

- **2026-04** — Versión inicial: velocímetro, CKD-EPI 2021, albuminuria, tabla de estadios,
  hoja imprimible, contador de visitas.
- **2026-09-22** — Cuadrícula de riesgo KDIGO G×A. Arreglo de la hoja impresa (el velocímetro
  no salía: `window.print()` se llamaba antes de que la imagen terminara de decodificarse; ahora
  espera `img.decode()`). Contador migrado a hits.sh.
- **2026-09-23** — Dominio `velocimetrorenal.com` conectado con HTTPS. Referencias
  bibliográficas y política de uso de datos. Textos alineados al uso médico en consulta.
  Campos opcionales paciente/médico en la hoja impresa. QR del dominio para presentaciones. Analítica GoatCounter.
- **2026-09-29** — Eventos de uso en GoatCounter (cálculo directo y CKD-EPI, sin valores).
- **2026-10-02** — Se probó y se quitó un contador visible de cálculos en la cabecera (el dato público de
  GoatCounter llega con 4 a 8 horas de atraso).
- **2026-11-25** — Buscadores y asistentes de IA: guía en texto con botón «Más información», etiquetas para
  redes, datos estructurados, `robots.txt`, `sitemap.xml`, `llms.txt`, imagen de vista previa e icono.

## Pendiente

- Aviso al usuario cuando pulsa Imprimir sin haber ingresado la TFG (hoy el botón no hace nada).
- El evento `calculo/tfg-directa` cuenta de menos: el resultado aparece al teclear y casi nadie pulsa el botón.
- Decidir si se reemplaza el contador `hits.sh` (cuenta cargas de página, no visitantes).
- Guía en texto solo en español; no hay versión en inglés.
