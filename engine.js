// ============================================================================
// ANPE Comparativa de Retribuciones Docentes — calculation engine
// Ported cell-by-cell from comparativa.xlsx (sheets Retribuciones + Nómina mensual)
// Column order for cuerpo docente arrays (index 0..8) = F..N in Retribuciones:
//   0:597-Maestros 1:591-PTFP 2:596-MaestrosTAPD 3:590-Secundaria 4:592-EOI
//   5:594-Musica/ArtesEsc 6:595-ArtesPlasticas 7:511-Catedraticos 8:510-Inspeccion
//
// Recurring pattern — "Complemento de cargo de Inspector": several comunidades' official documents
// pay Inspección a distinct "cargo"/"singular inspector" rate ON TOP OF whatever específico/autonómico
// rate it shares structurally with every other cuerpo, rather than one flat combined number. Modeled
// as its own field, `complementoCargoInspector` (an arr9 with a real figure only at idx 8), added
// alongside especifico/especificoAutonomico in the annual formula and shown as its own line item —
// NOT summed into either of those fields, even though early drafts of a few comunidades did that
// before being split out (2026-09-20, at the user's request, since it's a genuinely different concept
// each time, not a variant of específico or autonómico). Generically supported in makeStandard();
// hand-coded comunidades (Aragón, Baleares, Galicia, La Rioja) read/push it directly in their own
// calc(). Confirmed so far in: Baleares (994,16€, "C.Específic Singular Inspector"), Extremadura
// (610,22€, "Inspector/a" de la tabla de Inspección Educativa), Galicia (938,38€, "Complemento de
// cargo de Inspector"), La Rioja (666,22€), Aragón (850,18€, "puesto de inspector" — not reduced to
// 90% in paga extra, unlike específico/sexenio there), Cantabria (1.062,50€, "complemento de puesto" —
// this also revealed that Cantabria's old especificoAutonomico=1140,46€ exclusive to Inspección wasn't
// a real CEA at all, just its específico básico mislabeled; removed), Castilla La Mancha (1.095,71€,
// aparte del específico y del autonómico JCCM). Checked and RULED OUT for Andalucía (2026-09-20):
// its 2.175,81€ específico de Inspección is confirmed, from the actual document, to be one single real
// figure — not two partidas summed. Castilla y León (801,88€, "Desempeño de puestos de Función
// Inspectora" — Inspectores de Educación, la fila base sin cargo de jefe provincial/coordinador —
// separado de su C. COMUNIDAD, que quedaba en 234,63€, no en el 1.036,51€ lumped anterior). Asturias
// remains unconfirmed (its source PDF is a scanned image this session's tooling can't render/OCR);
// worth checking against a text-extractable copy if one turns up.
//
// Castilla y León, revisión completa 2026-09-20 contra la ORDEN PRE/1/2026 (BOCyL 05-01-2026): Adicional
// Maestro ESO corregido a 138,58€ (antes 133,20€, desactualizado); Tutoría ("Función Tutorial", puesto
// singular) fijada en 20€/mes, antes 0€; añadida la tabla de cargo directivo para Centros Rurales
// Agrupados (CRA), que no existía. El campo complementoMejora ("PRODUCTIVIDAD" en el documento) es en
// realidad "Consolidación punto 4º", un importe incondicional de la tabla de mensualidades — no tiene
// nada que ver con carrera profesional, así que se paga siempre (opts.complementoMejoraAlwaysOn),
// dejó de depender del interruptor "Carrera profesional". Carrera profesional (2026-09-20, contra
// csif.es/es/articulo/castillayleon/educacion/83250 y la Ley 7/2019): conectada al cálculo — categorías
// C1-C4 acumulativas a partir de 5/10/16/23 años, EXCLUYENTE con los sexenios (hay que elegir, no se
// suman); esta app paga automáticamente la que sea más alta cuando el interruptor está activo.
// ============================================================================
(function(global){
'use strict';

const CUERPOS = [
  '597-Maestros',
  '591-Profesores Técnicos de Formación Profesional',
  '596-Maestros de Taller de Artes Plásticas y Diseño',
  '590-Profesores Enseñanza Secundaria',
  '592-Profesores de Escuelas Oficiales de Idiomas',
  '594-Profesores de Música y Artes Escénicas',
  '595-Profesores de Artes Plásticas y Diseño',
  '511-Catedráticos',
  '510-Inspección'
];
// 598-Profesores especialistas en sectores singulares de FP (short code 598-PESSFP) is a real,
// distinct cuerpo docente the user wants selectable, but is paid IDENTICALLY to 591-PTFP/596-MaestrosTAPD
// in every community ("trátalo igual que 591 y 596"). Rather than widening every 9-element salaryData
// array to 10 (touching arr9()/calc()/etc. across all 18 communities — real regression risk for zero
// behavioral difference), it is modeled as a pure NAME ALIAS onto index 1, the same physical data slot
// 591/596 already share. cuerpoIndex() resolves it to idx 1 exactly like the other two; nothing else in
// the engine (calc(), arr9 data, groupOf) ever needs to know a 10th cuerpo "exists".
// The FULL descriptive name (following the same naming pattern as every other cuerpo in CUERPOS) is the
// actual selectable dropdown value/string that CUERPO_ALIASES keys on; CUERPO_598_SHORT ("598-PESSFP",
// no hyphen between PES and SFP) is only used in compact contexts, e.g. the admin-tab merged-column header.
const CUERPO_598_LABEL = '598-Profesores especialistas en sectores singulares de FP';
const CUERPO_598_SHORT = '598-PESSFP';
const CUERPO_ALIASES = { [CUERPO_598_LABEL]: 1 };
// Combined list for UI selects that must offer 598 as its own distinct option, ordered by código de
// especialidad ascending (510, 511, 590, 591, 592, 594, 595, 596, 597, 598) — independent of the
// internal 0..8 salaryData/CUERPOS index scheme, which stays completely untouched below.
const CUERPO_SELECT_OPTIONS = [
  CUERPOS[8], CUERPOS[7], CUERPOS[3], CUERPOS[1], CUERPOS[4],
  CUERPOS[5], CUERPOS[6], CUERPOS[2], CUERPOS[0], CUERPO_598_LABEL
];
const GROUP_A2_IDX = new Set([0,1,2]); // 597,591,596 (and alias 598) => A2 ; rest => A1
function groupOf(idx){ return GROUP_A2_IDX.has(idx) ? 'A2' : 'A1'; }
// Lets the profile explicitly pick which cargo-directivo table (CEIP/IES/CRA) applies, overriding
// the cuerpo-derived default — e.g. a Maestro working in an IES, or any cuerpo working in a CRA.
// Falls back to the automatic groupOf() mapping when no override is given, or the requested table
// doesn't exist for this comunidad (most only have CEIP/IES, not CRA).
function resolveCargoGroup(community, idx, override){
  const table = CARGO_TABLE[community];
  if (override && table && table[override]) return override;
  return groupOf(idx);
}
function cuerpoIndex(name){
  const i = CUERPOS.indexOf(name);
  if (i !== -1) return i;
  return Object.prototype.hasOwnProperty.call(CUERPO_ALIASES, name) ? CUERPO_ALIASES[name] : -1;
}
function trunc(x){ return Math.trunc(x); }
function si(flag){ return String(flag||'').trim().toLowerCase() === 'si' || String(flag||'').trim().toLowerCase() === 's'; }
// Normalizes the 3-way "Situación Laboral" field to one of 'clasesPasivas' | 'ssocial' | 'interino'.
// Accepts either the internal UI value keys or the human-readable Spanish labels; anything
// unrecognized (including the old binary field's absence) defaults to 'ssocial', the most common
// modern regime.
function normSituacion(v){
  const s = String(v||'').trim().toLowerCase();
  if (s === 'clasespasivas' || s === 'clases pasivas' || s === 'funcionario clases pasivas') return 'clasesPasivas';
  if (s === 'interino' || s === 'laboral' || s === 'interino o laboral') return 'interino';
  return 'ssocial';
}

// generic "standard 16-community" sexenio staircase: tiers use INT(anios/6); "sin" only fires
// below the first tier (k===0). Corrected 2026-09-19 at the user's request for Cantabria (the only
// community with a nonzero sexenio.sin=35,77€ — every other community has sin:0, so this change is
// a no-op for them): the ORIGINAL master Excel additively kept "sin sexenio" in the total even once
// real sexenio tiers (s1, s2, ...) had accrued (source formula literally fires whenever
// INT(anios/3)<6, i.e. any años<18, regardless of the separate INT(anios/6) tier check) — verified
// against ground_truth_fixture.json (anios=8/14 cases previously matched that inherited quirk to the
// cent). The user confirmed Cantabria's real payroll does NOT do this: once a sexenio tier applies,
// "sin sexenio" stops being paid. This intentionally diverges validate.js for Cantabria at anios 6-17
// (case3/case4), the same kind of deliberate correction already applied to La Rioja elsewhere.
// sinPersists (2026-09-22, País Vasco): the one genuine exception to the Cantabria correction above —
// País Vasco's "sin sexenio" is not a placeholder for "no sexenio yet", it's a real, unconditional
// capitalización (2º y 3º sexenio, paid flat from day one regardless of años de servicio) that must
// keep being paid ON TOP of the ladder once real tramos accrue, not replaced by it. Every other
// comunidad omits this 3rd argument (default false), so their "sin" keeps the Cantabria-corrected
// cutoff-at-first-tier behavior untouched.
function sexenioStandard(anios, t, sinPersists){
  const k = trunc(anios/6);
  const floor = sinPersists ? t.sin : 0;
  if (k > 0 && k < 2) return floor + t.s1;
  if (k > 1 && k < 3) return floor + t.s1+t.s2;
  if (k > 2 && k < 4) return floor + t.s1+t.s2+t.s3;
  if (k > 3 && k < 5) return floor + t.s1+t.s2+t.s3+t.s4;
  if (k > 4) return floor + t.s1+t.s2+t.s3+t.s4+t.s5;
  return t.sin;
}

function arr9(v0,v1,v2,v3,v4,v5,v6,v7,v8){ return [v0,v1,v2,v3,v4,v5,v6,v7,v8]; }
function flat(F,rest){ return [F,rest,rest,rest,rest,rest,rest,rest,rest]; } // F literal, rest same
function fill(v){ return [v,v,v,v,v,v,v,v,v]; }
function onlyF(v){ return [v,0,0,0,0,0,0,0,0]; }

// ----------------------------------------------------------------------------
// CARGO DIRECTIVO lookup matrices (Nómina mensual!row29 INDEX/MATCH per community).
// Filled in as extraction completes; "Sin cargo" is always 0 so defaults are correct
// even before every matrix is populated. Structure: { A1:{tipo:{cargo:valor}}, A2:{...} }
// ----------------------------------------------------------------------------
const CARGOS = ['Sin cargo','Dirección','Vicedirección','Jefatura de Estudios','Jefatura de Estudios Adjunta','Secretaría'];
const TIPOS = ['A','B','C','D','E','F'];
function emptyCargoTable(){
  const mk = () => { const o={}; TIPOS.forEach(t=>{ o[t]={}; CARGOS.forEach(c=>o[t][c]=0); }); return o; };
  return { A1: mk(), A2: mk() };
}
const CARGO_TABLE = {}; // community -> table; populated below via setCargoTable() once data lands

// A few comunidades (so far, Castilla-La Mancha) publish a THIRD cargo-directivo table for Colegios
// Rurales Agrupados (CRA) alongside the usual CEIP/IES ones — same row order as CARGO_RAW.
const CARGO_RAW_CRA = {
  'Castilla La Mancha': [[0,968.99,0,690.97,312.54,690.97],[0,918.31,0,641.47,312.54,641.47],[0,771.25,0,592.07,312.54,592.07],[0,646.59,0,520.32,312.54,520.32],[0,533.49,0,463.64,312.54,463.64],[0,416.45,0,0,312.54,0]],
  // ANPE Asturias: tabla "Colegios Rurales Agrupados" — sin tipo A (empieza en B); mismos importes
  // que "Centros de Educación Permanente de Adultos" en el mismo documento.
  'Asturias': [[0,0,0,0,0,0],[0,603.93,0,262.76,0,262.76],[0,441.18,0,255.97,0,255.97],[0,330.12,0,0,0,188.85],[0,0,0,0,0,0],[0,0,0,0,0,0]],
  // ANPE Castilla y León: tabla "Centros Rurales Agrupados (CRA)" — sin tipo A (empieza en B);
  // Jefatura de Estudios Adjunta es 247,08€ uniforme en CRA (frente a 166,03€ en Secundaria/Infantil).
  'Castilla y León': [[0,0,0,0,247.08,0],[0,670.21,0,293.87,247.08,293.87],[0,507.44,0,287.04,247.08,287.04],[0,396.33,0,232.41,247.08,232.41],[0,273.36,0,0,247.08,199.06],[0,164.13,0,0,247.08,0]],
};
const CARGO_ERROR = '__EXCEL_ERROR__'; // sentinel: original workbook itself errors (#REF!/#VALOR!) for this combo
// Per-cell custom message for a CARGO_ERROR sentinel, keyed 'community|grupo|tipo|cargo'; falls back
// to a generic message in computeCommunity() when no entry exists here.
const CARGO_ERROR_MESSAGES = {};

// Raw cargo-directivo matrices extracted verbatim from Retribuciones!Q..AA per community.
// Row order A..F (tipo de centro); each row = [SinCargo, Direccion, Vicedireccion, JefaturaEstudios, Secretaria]
const CARGO_RAW = {
  // Corrected 2026-09-20 contra "RETRIBUCIONES-DOCENTES-2026" (BOCyL... no, Canarias, subida 1,5%
  // RD-Ley 14/2025): "J. Estud.Adj" (Secundaria/EOI) YA estaba descrito arriba como 173,21/166,03/
  // 128,89/103,14€ por tipo A-D, pero el array nunca reflejaba esos valores (tenía 173,21 fijo en
  // todas las filas) — corregido junto con el resto de la tabla (Director/J.Estudios/Secretario/
  // Vicedirector), que solo tenía la subida del 1,5% pendiente. Tabla Infantil/Primaria también
  // actualizada con la misma subida del 1,5%.
  'Canarias': { A2:[[0,560.63,230.04,230.04,0,230.04],[0,511.51,220.47,220.47,0,220.47],[0,385.75,206.07,206.07,0,206.07],[0,293.51,0,160.56,0,160.56],[0,198.90,0,0,0,107.85],[0,124.64,0,0,0,0]],
                A1:[[0,706.64,346.39,346.39,173.21,346.39],[0,626.80,332.00,332.00,166.03,332.00],[0,564.46,257.69,257.69,128.89,257.69],[0,514.12,206.18,206.18,103.14,206.18],[0,0,0,0,173.21,0],[0,0,0,0,173.21,0]] },
  // "Jefatura de Estudios Adjunta" (Jefatura de Estudios Adjunta column, IES only) per ANPE Andalucía 2026.
  // Corrected 2026-09-21 against UGT Servicios Públicos Andalucía, "Retribuciones del profesorado
  // andaluz 2026": tipo C (Secundaria, "-20 unidades"/Régimen Especial "-601 alumnos") had "J.
  // Estud./Secr. Sección" wrong (200,53€, should be 192,75€ — the document lists it separately from
  // A/B) and "J. Estudios Adjunta" wrong (151,32€, should be 0€ — the document marks tipo C with "--"
  // for this role, i.e. it doesn't exist there). Tipos D/E/F don't exist for Secundaria in the
  // document at all (only A-C) — they previously carried a stray 151,32€ Jefatura Adjunta value with
  // no other role populated, now zeroed out entirely.
  'Andalucía': { A2:[[0,803.31,0,442.01,0,442.01],[0,703.42,0,355.85,0,355.85],[0,505.11,0,269.68,0,269.68],[0,308.2,0,182.31,0,182.31],[0,208.36,0,0,0,0],[0,0,0,0,0,0]],
                 A1:[[0,994.55,524.39,200.53,151.32,200.53],[0,797.63,437.01,200.53,151.32,200.53],[0,697.7,350.9,192.75,0,192.75],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
  // "Jefatura de Estudios Adjunta": 223,81€/mes, importe fijo igual en CEIP e IES (ANPE Aragón).
  'Aragón': { A2:[[0,737.14,0,305.31,223.81,305.31],[0,667.27,0,286.88,223.81,286.88],[0,482.88,0,277.7,223.81,277.7],[0,367.22,0,204.03,223.81,204.03],[0,269.62,0,0,223.81,171.78],[0,171.91,0,0,223.81,0]],
              A1:[[0,899.46,459.72,459.72,223.81,459.72],[0,774.74,454.5,454.5,223.81,454.5],[0,701.3,332.96,332.96,223.81,332.96],[0,634.87,286.88,286.88,223.81,286.88],[0,0,0,286.88,223.81,286.88],[0,0,0,0,223.81,0]] },
  // "Jefe/a de Estudios Adjunto/a": 203,49€/mes, importe fijo — confirmado por ANPE Asturias como
  // exclusivo de "Centros de Enseñanza Secundaria, FP y Asimilados" (grupo A1), no existe en CEIP.
  'Asturias': { A2:[[0,665.59,0,276.41,0,276.41],[0,603.93,0,262.76,0,262.76],[0,441.18,0,255.97,0,255.97],[0,330.12,0,0,0,188.85],[0,0,0,0,0,0],[0,0,0,0,0,0]],
                A1:[[0,808.85,0,424.37,203.49,424.37],[0,698.77,0,417.52,203.49,417.52],[0,633.94,0,303.18,203.49,303.18],[0,0,0,0,203.49,0],[0,0,0,0,203.49,0],[0,0,0,0,203.49,0]] },
  // "Cap d'Estudis Adjunt": 186,53€/mes uniforme (Secundària), según ANPE Balears 2026.
  'Baleares (Islas)': { A2:[[0,0,0,0,0,0],[0,648.44,0,281.51,0,281.51],[0,477.4,0,262.54,0,262.54],[0,356.72,0,196.93,0,196.93],[0,218.35,0,0,0,145.88],[0,105.63,0,0,0,0]],
                        A1:[[0,848.3,0,414.65,186.53,414.65],[0,740.95,0,408.06,186.53,408.06],[0,665.41,0,302.49,186.53,302.49],[0,595.9,0,256.83,186.53,256.83],[0,0,0,207.48,186.53,0],[0,0,0,0,186.53,0]] },
  // Corrected 2026-09-19 against the official ANPE Cantabria retribuciones table (anpecantabria.es/
  // retribuciones, actualizado 24/07/2026): Dirección tipo B (A2) was 858.75, real figure is 856.75;
  // tipo D (A2) was 458.52, real figure is 458.42.
  // "Jefe/a de Estudios Adjunto/a": 195,90€/mes (Primaria) y 309,86€/mes (Secundaria), ANPE Cantabria.
  'Cantabria': { A2:[[0,946.47,0,376.03,195.9,376.03],[0,856.75,0,353.33,195.9,353.33],[0,620.01,0,342.01,195.9,342.01],[0,458.42,0,251.3,195.9,251.3],[0,279.67,0,0,195.9,195.9],[0,120.73,0,0,195.9,0]],
                 A1:[[0,1154.85,580.11,580.11,309.86,580.11],[0,994.72,568.88,568.88,309.86,568.88],[0,900.5,410.05,410.05,309.86,410.05],[0,815.19,353.33,353.33,309.86,353.33],[0,0,0,0,309.86,0],[0,0,0,0,309.86,0]] },
  // Corrected 2026-09-19 against el boletín oficial ANPE Castilla-La Mancha 2026 (todos los importes
  // estaban entre un 4% y un 7% por debajo del documento actual, ver META). Re-verificado 2026-09-21
  // contra la Orden 194/2025, de 29 de diciembre (DOCM núm. 3, 07-01-2026), Anexo III, apartado 2.1 —
  // documento oficial de la Junta, no sindical: coincide cifra a cifra salvo Dirección de Secundaria
  // tipo A (A1), que estaba en 958,93€ — el documento real dice 985,93€ (probable transposición de
  // dígitos en la fuente ANPE usada antes); corregido.
  'Castilla La Mancha': { A2:[[0,885.8,0,607.77,312.54,607.77],[0,835.11,0,558.29,312.54,558.29],[0,688.09,0,508.87,312.54,508.87],[0,563.41,0,437.13,312.54,437.13],[0,450.29,0,380.45,312.54,380.45],[0,333.27,0,0,312.54,0]],
                          A1:[[0,985.93,0,749.83,312.54,749.83],[0,886.61,0,687.26,312.54,687.26],[0,835.39,0,636.98,312.54,636.98],[0,790.05,0,599.33,312.54,599.33],[0,0,0,0,312.54,0],[0,0,0,0,312.54,0]] },
  // "Jefatura de Estudios Adjunta": 166,03€/mes uniforme, según ANPE Castilla y León 2026.
  'Castilla y León': { A2:[[0,650.85,0,226.49,166.03,226.49],[0,589.17,0,212.83,166.03,212.83],[0,426.39,0,205.99,166.03,205.99],[0,315.28,0,151.37,166.03,151.37],[0,192.31,0,0,166.03,118.01],[0,83.08,0,0,166.03,0]],
                       A1:[[0,794.15,0,349.4,166.03,349.4],[0,684.06,0,342.57,166.03,342.57],[0,619.25,0,247,166.03,247],[0,560.58,0,212.83,166.03,212.83],[0,0,0,0,166.03,0],[0,0,0,0,166.03,0]] },
  // Corrected 2026-09-20 against the official Generalitat spreadsheet (educacio.gencat.cat,
  // taules-retributives.xlsx, full "SINGULARS 2026") and confirmed against a third source, CCOO
  // Educació's "horaris i retribucions" PDF (ccoo.cat, febrer 2026): A1 (Instituts, tipos A-D) was
  // uniformly ~4% below the real 2026 figures; A2 (Escoles, tipos A-F ↔ document's E-J) was
  // substantially wrong, not just outdated — Jefatura de Estudios/Secretaría shares Director's rate
  // for a given tipo per the document (one combined "Secretari/Cap d'Estudis" figure), unlike the old
  // per-role split. Jefatura de Estudios Adjunta (Institutos, tipos A-D) added 2026-09-20: both
  // sources list a "Càrrecs directius addicionals" row for Instituts, distinct from but numerically
  // identical to Secretari/Cap d'Estudis for the same tipo — that row is this role, previously left at
  // 0€ by mistake. Escoles have no equivalent row in either source (only a "Coordinador AFA" stipend
  // specific to tipo H, a different, unrelated role), so Jefatura Adjunta stays unmodeled (0€) there.
  'Cataluña': { A2:[[0,882.32,0,551.13,0,551.13],[0,833.46,0,522.55,0,522.55],[0,717.29,0,474.53,0,474.53],[0,605.43,0,429.81,0,429.81],[0,422.61,0,0,0,288.45],[0,305.6,0,0,0,0]],
                A1:[[0,1183.48,0,886.11,886.11,886.11],[0,1029.03,0,778.91,778.91,778.91],[0,881.31,0,671.76,671.76,671.76],[0,814.79,0,618.73,618.73,618.73],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
  // Updated 2026-09-20 from the official document (Junta de Extremadura, 2026): "Jefatura Estudios
  // Adjunta" 100,05€/mes (Otros centros) y 161,08€/mes (Secundaria) — sin cambios, ya coincidía.
  // Dirección/Jefatura de Estudios/Secretaría por tipo de centro, actualizados; Vicedirección se
  // sigue igualando a Jefatura de Estudios (el documento no la lista por separado).
  'Extremadura': { A2:[[0,631.48,0,219.75,100.05,219.75],[0,571.62,0,206.50,100.05,206.50],[0,413.70,0,199.88,100.05,199.88],[0,305.90,0,146.86,100.05,146.86],[0,186.59,0,0,100.05,114.51],[0,80.60,0,0,100.05,0]],
                   A1:[[0,770.50,338.98,338.98,161.08,338.98],[0,663.67,332.41,332.41,161.08,332.41],[0,600.79,239.63,239.63,161.08,239.63],[0,543.85,206.50,206.50,161.08,206.50],[0,0,206.50,206.50,161.08,206.50],[0,0,0,0,161.08,0]] },
  'Galicia': { A2:[[0,711.93,0,287.57,0,287.57],[0,650.24,0,273.89,0,273.89],[0,487.48,0,267.07,0,267.07],[0,376.36,0,212.45,0,212.45],[0,0,0,0,0,0],[0,0,0,0,0,0]],
               A1:[[0,855.23,410.45,410.45,0,410.45],[0,745.13,403.68,403.68,0,403.68],[0,680.31,308.04,308.04,0,308.04],[0,621.66,273.89,273.89,0,273.89],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
  // "Jefe/a de Estudios Adjunto/a": 175,84€/mes, importe fijo (ANPE La Rioja).
  'La Rioja': { A2:[[0,662.64,0,230.55,175.84,230.55],[0,599.84,0,216.66,175.84,216.66],[0,434.09,0,209.7,175.84,209.7],[0,320.94,0,154.04,175.84,154.04],[0,195.78,0,120.1,175.84,120.1],[0,84.52,0,0,175.84,0]],
                A1:[[0,808.65,0,355.71,175.84,355.71],[0,696.48,0,348.79,175.84,348.79],[0,630.48,0,251.4,175.84,251.4],[0,570.74,0,216.66,175.84,216.66],[0,0,0,0,175.84,0],[0,0,0,0,175.84,0]] },
  // Corrected 2026-09-21 against ANPE Madrid, "Retribuciones 2026" (febrero 2026): the old values
  // (918,17/495,8118 CEIP, 993,77/596,262 IES) matched nothing real — a stale guess. Madrid's real
  // Director pay is "módulo fijo (653,57€ CEIP/IES) + 0,63€/alumno matriculado", and Vicedirector/
  // Jefe de Estudios/Secretario are the document's own percentage (54% CEIP, 60% IES) of that FULL
  // Director figure (fijo+variable) — not tied to tamaño de centro A-F at all, only to enrollment,
  // which this engine has no per-profile input for. Modeled here (2026-09-21, a petición del usuario)
  // using an assumed alumnado per tipo de centro as a stand-in for real enrollment: IES A=1000,
  // B/C/D=700, E/F=400; CEIP A=700, B/C/D=500, E/F=250. Director = 653,57 + 0,63×alumnos; V/JE/S =
  // 54%/60% of that Director figure. E.g. IES tipo A: 653,57+0,63×1000=1.283,57 → ×60%=770,14.
  // Jefatura de Estudios Adjunta (385,49€) is the one role that's genuinely flat/enrollment-
  // independent, unaffected by this assumption. These starting figures are immediately overwritten
  // at load by recalcMadridCargoDirectivo() (near COMUNIDADES['Madrid'], below) from
  // COMUNIDADES['Madrid'].rules.alumnos — the single source of truth from here on; kept here only so
  // this table isn't empty before that runs, and as a readable record of the numbers it produces.
  'Madrid': { A2:[[0,1094.57,591.07,591.07,385.49,591.07],[0,968.57,523.03,523.03,385.49,523.03],[0,968.57,523.03,523.03,385.49,523.03],[0,968.57,523.03,523.03,385.49,523.03],[0,811.07,437.98,437.98,385.49,437.98],[0,811.07,437.98,437.98,385.49,437.98]],
              A1:[[0,1283.57,770.14,770.14,385.49,770.14],[0,1094.57,656.74,656.74,385.49,656.74],[0,1094.57,656.74,656.74,385.49,656.74],[0,1094.57,656.74,656.74,385.49,656.74],[0,905.57,543.34,543.34,385.49,543.34],[0,905.57,543.34,543.34,385.49,543.34]] },
  // Corrected 2026-09-21 against CCOO Región de Murcia, "Retribuciones enseñanza" (enero 2026):
  // Secundaria (A1) had a real, previously-unmodeled Vicedirección column (621,24/544,01/498,55/
  // 457,39€, tipos A-D — CEIP/A2 doesn't have this role) and Jefatura de Estudios Adjunta column
  // (459,70/404,85/372,55/343,39€, tipos A-D — same, A1-only). Tipo F's stray Secretaría value
  // (240,24€) had no other role populated and doesn't correspond to anything in either source
  // (neither lists tipo E/F for Secundaria's cargo directivo at all) — zeroed out as a stale artifact.
  'Murcia': { A2:[[0,913.32,0,520.74,0,520.74],[0,832.82,0,477.45,0,477.45],[0,646.54,0,377.27,0,377.27],[0,526.98,0,313.01,0,313.01],[0,395.02,0,242.09,0,242.09],[0,204.86,0,0,0,0]],
              A1:[[0,1100.32,621.24,621.24,459.70,621.24],[0,956.65,544.01,544.01,404.85,544.01],[0,872.05,498.55,498.55,372.55,498.55],[0,795.56,457.39,450.63,343.39,457.39],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
  // Corrected 2026-09-21 contra el DOGV oficial (Acuerdo de 27-02-2026, del Consell, DOGV núm. 10312,
  // "Taula 2 — Retribucions del personal docent"): los valores anteriores eran de una tabla desactualizada
  // (todos por debajo de los actuales, la mayoría ~11-14€, consistente con la subida del RD-ley 14/2025
  // de 2026 aún no aplicada) — confirmado cifra a cifra: Dirección/Jefatura de Estudios/Secretaría por
  // tipo de centro A-C (D-F no tienen columna A1 en el documento, solo A2; sin Jefatura de Estudios
  // Adjunta en ningún tipo, a diferencia de Murcia/La Rioja).
  'Valencia': { A2:[[0,788.00,0,512.22,0,512.22],[0,725.03,0,471.29,0,471.29],[0,558.89,0,363.33,0,363.33],[0,445.56,0,289.62,0,289.62],[0,196.23,0,0,0,0],[0,0,0,0,0,0]],
                A1:[[0,934.23,607.28,607.28,0,607.28],[0,821.88,534.22,534.22,0,534.22],[0,755.74,491.25,491.25,0,491.25],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
  // Corregido 2026-09-21 contra CSIF "Retribuciones docentes 2026" (Ceuta y Melilla) — segunda fuente,
  // cruzada contra la propia tabla de ANPE Melilla de 2022 (única con cifras de Ceuta/Melilla que ANPE
  // ha publicado: no tiene tabla 2026, solo pensiones): los 8 importes de cargo directivo de 2022
  // escalan al alza EXACTAMENTE ×1,1196 hasta llegar a los de CSIF 2026 (comprobado cifra a cifra en
  // Dirección y Jefatura de Estudios/Secretaría, primaria y secundaria) — confirma que la tabla CSIF es
  // fiable para cargo directivo (a diferencia de su específico, marcado "orientativo" en el propio
  // documento y con una relación entre cuerpos que no cuadra con la de ANPE 2022, no aplicado). Añadida
  // también Jefatura de Estudios Adjunta (164,25€, solo IES tipos A-D — antes en 0€, sin fuente).
  'Ceuta y Melilla': { A2:[[0,643.85,0,224.06,0,224.06],[0,582.85,0,210.56,0,210.56],[0,421.81,0,203.78,0,203.78],[0,311.89,0,149.73,0,149.73],[0,0,0,0,0,0],[0,0,0,0,0,0]],
                       A1:[[0,785.63,0,345.64,164.25,345.64],[0,676.74,0,338.93,164.25,338.93],[0,612.59,0,244.34,164.25,244.34],[0,554.54,0,210.56,164.25,210.56],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
  // Corregido 2026-09-21 contra el ANEXO I de la "Instrucción sobre retribuciones del personal docente"
  // (24-02-2026, Gobierno Vasco). El Anexo clasifica por cuerpo y por tamaño del centro (aulas para
  // Maestro/a EG01, alumnos para Profesor/a de ESO EG03) — se mapea sobre los tipos A-F de este modelo:
  // A2 = "Maestro/a EG01" (Director/a A-F; "C. Directivos" A-F, que el Anexo aplica por igual a Jefatura
  // de Estudios y Secretaría; Vicedirección no existe como tal en la fuente → 0; "Jefe/a de estudios
  // adjunto" 262,50€ uniforme). A1 = "Profesor/a de ESO EG03" (solo tipos A-D en la fuente; Jefe/a de
  // estudios adjunto 366,57€). LIMITACIONES conocidas: (1) 591-PTFP y 596-Maestros de Taller comparten
  // aquí la tabla A2 de Maestros, pero el Anexo les da una tabla propia por alumnos (EG04: Director/a
  // 827,46/739,81/692,25/648,08€) — no modelable sin un tercer grupo. (2) 511-Catedráticos comparten la
  // tabla A1 de Profesor/a de ESO, pero el Anexo trae una propia (EG02: Director/a 740,99/653,51/606,06/
  // 561,93€). (3) "Maestro/a en ESO EG01" tiene otra tabla más (Director/a A 827,46€...). (4) El
  // documento prohíbe cobrar a la vez dos conceptos del Anexo (se paga el mayor): lo resuelve la regla
  // común resolveSingulares() (ver computeCommunity), igual para todas las comunidades.
  'País Vasco': { A2:[[0,743.78,0,348.16,262.5,348.16],[0,699.14,0,337.46,262.5,337.46],[0,553.35,0,337.46,262.5,337.46],[0,455.45,0,262.5,262.5,262.5],[0,365.69,0,68.23,262.5,68.23],[0,253.57,0,68.23,262.5,68.23]],
                  A1:[[0,871.06,0,503.44,366.57,503.44],[0,783.42,0,492.85,366.57,492.85],[0,735.86,0,386.89,366.57,386.89],[0,691.7,0,366.57,366.57,366.57],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
  'Navarra': { A2:[[0,665.07,323.04,323.04,0,323.04],[0,608.07,323.04,323.04,0,323.04],[0,551.08,285.03,285.03,0,285.03],[0,456.05,285.03,285.03,0,247.03],[0,361.04,285.03,285.03,0,0],[0,228.03,285.03,0,0,0]],
               A1:[[0,790.56,383.99,383.99,0,383.99],[0,722.8,383.99,383.99,0,383.99],[0,655.04,338.81,338.81,0,338.81],[0,655.04,338.81,338.81,0,338.81],[0,0,0,0,0,0],[0,0,0,0,0,0]] }
};
// Corrected 2026-09-19: this app used to force a CARGO_ERROR for Cantabria's grupo A2 whenever tipo
// de centro !== 'A', on the theory that the "Nómina mensual" sheet's own live MATCH/INDEX formula for
// cargo directivo restricts its lookup range to a single row (Q197:Q197 / R197:V197) and therefore
// errors for any other tipo. Re-checked directly against the "Retribuciones" sheet (rows 195-202,
// columns Q-V): that sheet's OWN cargo-directivo table — the one this app's CARGO_RAW actually reads,
// and the one the validated ANNUAL formula uses — has complete, real, non-error numbers for every
// tipo A-F (a normal descending-by-school-size progression: 946.47/858.75/620.01/458.52/279.67/
// 120.73 €). The #REF!/#N/A only ever affected a separate, narrower lookup formula on the "Nómina
// mensual" sheet, which this app's engine never reads from at all (it always computes cargoAmt from
// the Retribuciones-sourced CARGO_RAW table). Forcing an error here was therefore over-cautious, not
// a defect in the underlying data — removed; Cantabria's A2 tipos B-F now return their real values.
for (const [comunidad, table] of Object.entries(CARGO_RAW)){
  const t = emptyCargoTable();
  ['A2','A1'].forEach(grp=>{
    TIPOS.forEach((tipo,i)=>{
      CARGOS.forEach((cargo,j)=>{
        const v = table[grp][i][j];
        t[grp][tipo][cargo] = v;
      });
    });
  });
  CARGO_TABLE[comunidad] = t;
}
for (const [comunidad, rows] of Object.entries(CARGO_RAW_CRA)){
  const mk = () => { const o={}; TIPOS.forEach(t=>{ o[t]={}; CARGOS.forEach(c=>o[t][c]=0); }); return o; };
  const cra = mk();
  TIPOS.forEach((tipo,i)=>{ CARGOS.forEach((cargo,j)=>{ cra[tipo][cargo] = rows[i][j]; }); });
  CARGO_TABLE[comunidad].CRA = cra;
}

// ============================================================================
// GENERIC (Ministerio de Educación) DATA
// Six fields — sueldoBase, extraSueldoBase, trienios, extraTrienio, muface, clasesPasivas — are set
// nationally and shared by every community unless that community's own `overrides` object supplies
// a different array for a given field (currently only Navarra, for `sueldoBase`). `genericFields`
// on a community definition lists which of these six fields actually apply to it structurally
// (all six for every community except Navarra, which has no extraSueldoBase/trienios/extraTrienio
// concept at all — see its calc()); defaults to GENERIC_FIELDS when not specified.
// ============================================================================
// "destino" joined the Ministry-generic fields 2026-09-19, at the user's request: 11 of the 18
// comunidades already shared the exact same "Complemento de destino" figures (the unmodified
// Ministry scale) with no override of their own — unifying it here just makes that existing fact
// explicit and editable in one place. The comunidades that DO pay a different destino (currently
// Asturias, Canarias, Cantabria, País Vasco — Baleares and Cataluña were removed from this list on
// 2026-09-20 once their real figures turned out to match GENERIC_DATA.destino exactly) keep their
// real figures via `overrides.destino` on their own definitions below — same numbers as before, now
// represented as a "valor propio" override instead of a hardcoded array. Navarra has no destino
// concept at all and is intentionally excluded via its own narrower `genericFields` list.
// Orden de visualización fijado 2026-09-22 a petición del usuario: sueldo base, destino, trienios,
// luego sus dos versiones "paga extra" juntas, y las deducciones (MUFACE/clases pasivas) al final —
// mismo orden en el Ministerio y en "Datos genéricos" de cada comunidad (ambos leen este mismo array).
const GENERIC_FIELDS = ['sueldoBase','destino','trienios','extraSueldoBase','extraTrienio','muface','clasesPasivas'];
const GENERIC_DATA = {
  sueldoBase:      arr9(1199.52,1199.52,1199.52,1387.24,1387.24,1387.24,1387.24,1387.24,1387.24),
  extraSueldoBase: arr9(874.83,874.83,874.83,856.05,856.05,856.05,856.05,856.05,856.05),
  trienios:        arr9(43.54,43.54,43.54,53.39,53.39,53.39,53.39,53.39,53.39),
  extraTrienio:    arr9(31.74,31.74,31.74,32.96,32.96,32.96,32.96,32.96,32.96),
  destino:         arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
  muface:          arr9(-40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68),
  clasesPasivas:   arr9(-92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04)
};

// Social Security contribution rates (worker's share) used by computeNational() below — kept as a
// mutable object (not inline literals) so the admin UI can expose them as editable Ministry fields.
// Values are fractions (0.047 = 4,70%), not percentages.
const SS_RATES = {
  contingenciasGeneral: 0.047,   // Contingencias Comunes — Funcionario Seguridad Social e Interino/Laboral
  contingenciasSSocial: 0.0445,  // Contingencias Comunes — tipo reducido, "Funcionario Seguridad Social"
  desempleo: 0.0155,             // Solo Interino/Laboral (sustituciones)
  formacionProfesional: 0.001,   // Solo Interino/Laboral
  mei: 0.0015                    // Funcionario Seguridad Social e Interino/Laboral (no Clases Pasivas)
};

// ============================================================================
// COMMUNITY DEFINITIONS
// Each: { salaryData: {...9-value arrays...}, rules: {...editable magic numbers...},
//         overrides: {field: [9 values]} (per-community overrides of GENERIC_DATA fields),
//         genericFields: [...] (optional; which GENERIC_FIELDS this community structurally has),
//         calc(anios, flags, cargoDirectivoAmount) => annual gross }
// flags = { maestroESO, tutor, islaNoCapitalina, funcionario, islaBaleares }
// ============================================================================
const COMUNIDADES = {};

// ---------- CANARIAS ----------
// Corrected 2026-09-20 contra el documento oficial "Retribuciones 2026 Personal Docente" (subida
// 1,5% RD-Ley 14/2025 de 2 de diciembre): destino, específico, extraEspecifico (78% del específico,
// confirmado exacto célula a célula), residencia y tutoría llevaban la cifra de 2025 sin actualizar.
// Inspección es un caso aparte: su específico salta a 1.733,05€ (tabla propia "Cuerpo Inspectores",
// rango base "Inspector/Nivel 26") — no es solo la subida del 1,5%, es un valor mayor que ya lo incluye
// todo, sin necesidad de separar un complemento de cargo aparte (a diferencia de otras CCAA). El
// "Adicional Maestro ESO" (aquí "Comp. Esp. Primer Ciclo ESO") pasa de 70,34€ a 91,53€.
COMUNIDADES['Canarias'] = {
  overrides: { destino: arr9(600.31,739.26,739.26,739.26,739.26,739.26,739.26,885.42,885.42) },
  salaryData: {
    destino: arr9(600.31,739.26,739.26,739.26,739.26,739.26,739.26,885.42,885.42),
    especifico: arr9(818.45,771.03,771.03,768.72,768.72,768.72,768.72,829.12,1733.05),
    extraEspecifico: arr9(638.39,601.40,601.40,599.60,599.60,599.60,599.60,646.71,1351.78),
    sexenio: {sin:0, s1:55, s2:64, s3:120, s4:180, s5:70},
    sexenioExtra: {s1:42.9, s2:49.92, s3:93.6, s4:140.4, s5:54.6},
    tutoria: arr9(35.53,35.53,35.53,35.53,35.53,35.53,35.53,35.53,0),
    residenciaCapitalina: arr9(146.72,146.72,146.72,163.00,163.00,163.00,163.00,183.39,203.70),
    residenciaNoCapitalina: arr9(488.66,488.66,488.66,542.93,542.93,542.93,542.93,610.80,678.64),
    trieniosResidenciaNoCapitalina: arr9(34.35,34.35,34.35,38.20,38.20,38.20,38.20,42.90,47.69),
    adicionalESO: onlyF(91.53),
    // "Complemento de mejora" / "Carrera profesional" (68,31€, solo Maestros) ELIMINADO 2026-09-21:
    // investigado a petición del usuario contra dos fuentes — el PDF oficial del Gobierno de Canarias
    // (retribuciones-2026-personal-docente.pdf) y la guía sindical STEC-IC "Revisa tu nómina"
    // (stec.es/.../_214.pdf, actualización febrero 2026) — y ninguna de las dos menciona un
    // "complemento de mejora" ni "carrera profesional" en absoluto; el propio código lo tenía oculto
    // del recibo (`hidden:true`) desde antes, señal de que ya se sospechaba sin verificar. Sin fuente
    // que lo respalde, Canarias no tiene carrera profesional modelada (no aparece en la pestaña
    // Análisis); si la Administración la implementa en el futuro, añadir aquí con su fuente real.
    productividad: fill(0),
    jefeDepartamento: arr9(0,71.96,71.96,71.96,71.96,71.96,71.96,71.96,0), // ANPE Canarias: "J. Departamento" (Otros Cargos): 71,96€/mes
  },
  rules: {},
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3), k6 = trunc(anios/6);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx])*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + d.extraEspecifico[idx]*2
      + d.extraTrienio[idx]*b*2
      + cargoAmt*14
      + jefeDept*14
      + (si(flags.islaNoCapitalina)
          ? d.residenciaNoCapitalina[idx]*12 + d.trieniosResidenciaNoCapitalina[idx]*b*12
          : d.residenciaCapitalina[idx]*12)
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      + sexenioStandard(anios, d.sexenio)*12
      + (si(flags.tutor) ? d.tutoria[idx]*12 : 0)
      + sexenioStandard(anios, {sin:d.sexenio.sin, ...d.sexenioExtra})*2
      // Adicional Maestro ESO EN LA EXTRA (2026-09-21, revisado a petición del usuario, "comunidad por
      // comunidad"): a diferencia de la mayoría, Canarias SÍ lo paga en la extra — pero, como el resto
      // del específico, reducido al 78%, no íntegro. Confirmado cifra a cifra contra el PDF oficial del
      // Gobierno de Canarias, tabla "Paga extra": la fila "Maestros ESO" muestra un específico de extra
      // de 709,78€, frente a los 638,39€ de "Maestros" — la diferencia (71,39€) es exactamente
      // adicionalESO(91,53€)×0,78 (91,53×0,78=71,39), no adicionalESO íntegro.
      + (si(flags.maestroESO) ? 71.39*2 : 0)
      + d.productividad[idx]*2;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      // Source quirk (Nómina mensual!row18): G18 = IF($C$10="NO", trienios*INT(años/3), 0) — the
      // monthly DISPLAY row for "Trienios" is hard-zeroed when islaNoCapitalina="SI" (its value is
      // instead folded into the "Residencia (isla no capitalina)" line's own trienios component via
      // trieniosResidenciaNoCapitalina). The ANNUAL formula has no such gate (validated as-is), so
      // `monthly` keeps the true (annual-matching) rate and only `displayMonthly` is zeroed.
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b, displayMonthly: si(flags.islaNoCapitalina) ? 0 : d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      items.push({label: si(flags.islaNoCapitalina) ? 'Residencia (isla no capitalina)' : 'Residencia (isla capitalina)',
        monthly: si(flags.islaNoCapitalina) ? d.residenciaNoCapitalina[idx] + d.trieniosResidenciaNoCapitalina[idx]*b : d.residenciaCapitalina[idx]});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      items.push({label:'Sexenios', monthly: sexenioStandard(anios, d.sexenio)});
      if (d.tutoria[idx] !== 0) items.push({label:'Tutoría', monthly: si(flags.tutor) ? d.tutoria[idx] : 0});
    }
    return base;
  },
  // Itemized version of the real paga extra (2026-09-21, a petición del usuario), for the "Su
  // nómina" payslip display: without this, the app's generic fallback (repeat every monthly concept
  // at its ordinary rate) produced a large NEGATIVE "Ajuste" row, because it doesn't know Canarias
  // pays a reduced específico in the extra (extraEspecifico, ~78% of the monthly específico) and
  // does NOT repeat Residencia or Adicional Maestro ESO at all (neither has a ×2 term in calc()).
  // "Sexenios" here also uses the REDUCED sexenioExtra ladder, not the full ordinary rate — corrected
  // 2026-09-21 against the STEC-IC union guide "Revisa tu nómina" (stec.es/.../_214.pdf, actualización
  // febrero 2026), whose "SEXENIOS €/Mes · *Extra S/T" table shows the extra payment at exactly 78%
  // of the ordinary rate (e.g. 1er sexenio: 55,00€ ordinario → 42,90€ extra, = d.sexenioExtra.s1
  // exactly). The previous version used the FULL rate here (with a `pagaExtraAdjust` topping up the
  // derived total to match), based only on the original Excel's own "Nómina mensual" sheet — which
  // this union source now shows was never actually verified and was wrong, same pattern as Murcia's
  // 70%/60% paga-extra formula. Sums to exactly pagaExtraTotal, so no "Ajuste" row is needed.
  pagaExtraItems(idx, anios, flags, d){
    const b = trunc(anios/3);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    // Adicional Maestro ESO reducido al 78% en la extra (ver nota en calc() arriba) — sumado al mismo
    // específico reducido, no como línea aparte, porque en la fuente oficial también es una única
    // cifra de específico ("709,78€"), no dos conceptos separados.
    const esoExtra = si(flags.maestroESO) ? 71.39 : 0;
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.extraEspecifico[idx] + esoExtra},
      {label:'Sexenios', monthly: sexenioStandard(anios, {sin:d.sexenio.sin, ...d.sexenioExtra})},
      {label:'Productividad', monthly: d.productividad[idx]},
    ];
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    return items;
  }
};

// ---------- ANDALUCÍA ----------
COMUNIDADES['Andalucía'] = {
  overrides: {},
  salaryData: {
    destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
    especifico: arr9(857.3,881.46,881.46,881.46,881.46,881.46,881.46,881.46,2175.81),
    especificoAutonomico: arr9(0,0,0,0,0,0,0,62.01,0),
    sexenio: {sin:0, s1:85.62, s2:99.51, s3:127.77, s4:162.29, s5:63.4},
    tutoria: arr9(31.97,31.97,31.97,31.97,31.97,31.97,31.97,31.97,0),
    residenciaCapitalina: fill(0), residenciaNoCapitalina: fill(0), trieniosResidenciaNoCapitalina: fill(0),
    adicionalESO: onlyF(137.03),
    complementoMejora: fill(0), productividad: fill(0),
    jefeDepartamento: arr9(0,0,0,58.57,58.57,58.57,58.57,58.57,0), // ANPE Andalucía: "Jefe de Departamento" (IES): 58,57€/mes
  },
  rules: {},
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const s = d.sexenio;
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    // Corrected 2026-09-19, then RE-corrected 2026-09-19 at the user's request: the ORIGINAL Excel's
    // tier-4 branch (Retribuciones!F80, "SUM(F63:F66)" under the $C$3/6>=4 case) drops the 1er
    // sexenio (F62) — a genuine bug, verified by comparing to the tier-5 branch's "SUM(F62:F66)".
    // The first fix mistakenly made tier 4 pay all 5 sexenios (matching tier 5); that's wrong too —
    // until 30 años you cannot have the 5º sexenio. Tier 4 must pay exactly 4 (s1-s4), which is what
    // the standard sexenioStandard() ladder (used by most comunidades) already does — so this now
    // just delegates to it instead of duplicating the logic.
    const escal = sexenioStandard(anios, s);
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+d.especificoAutonomico[idx])*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + (d.especifico[idx]+d.especificoAutonomico[idx])*2
      + d.extraTrienio[idx]*b*2
      + cargoAmt*14
      + jefeDept*14
      + (si(flags.islaNoCapitalina) ? 0 : d.residenciaCapitalina[idx]*12)
      // Corrected 2026-09-19 at the user's request: Andalucía's source formula gated adicionalESO/
      // tutoria on $C$4="s" / $C$7="s" (a single-letter literal that never equals the real selector
      // value "SI"/"NO"), so those complements never activated no matter what the user picked — a
      // dead condition. Now live: gated on the actual flags, same as every other complement.
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      // Adicional Maestro ESO EN LA EXTRA (2026-09-21, revisado a petición del usuario, "comunidad
      // por comunidad"): a diferencia de la mayoría, en Andalucía esto SÍ se paga en la extra, porque
      // no es un plus aparte — es un derecho reconocido (Decreto 196/2005, art. 1, y Acuerdo de
      // Consejo de Gobierno de 10-09-1991) a cobrar el complemento de destino de NIVEL 24 (729,14€) en
      // vez del nivel 21 propio (592,11€) mientras imparte 1er ciclo de ESO — confirmado además por
      // sentencia del Tribunal Supremo (extendida a Educación de Adultos y aulas hospitalarias). Como
      // el complemento de destino se paga siempre íntegro en la extra, esta diferencia (137,03€) va
      // con él, igual que en Valencia.
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*2 : 0)
      + (si(flags.tutor) ? d.tutoria[idx]*12 : 0)
      + (b < 6 ? s.sin : 0)
      + (si(flags.carreraGeneral) ? d.complementoMejora[idx]*12 : 0) + d.productividad[idx]*2
      + escal*14;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      if (d.especificoAutonomico[idx] !== 0) items.push({label:'Complemento específico autonómico', monthly: d.especificoAutonomico[idx]});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (!si(flags.islaNoCapitalina) && d.residenciaCapitalina[idx] !== 0) items.push({label:'Residencia', monthly: d.residenciaCapitalina[idx]});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      if (d.tutoria[idx] !== 0) items.push({label:'Tutoría', monthly: si(flags.tutor) ? d.tutoria[idx] : 0});
      items.push({label:'Sexenios', monthly: escal});
      if (d.complementoMejora[idx] !== 0) items.push({label:'Complemento de mejora', monthly: si(flags.carreraGeneral) ? d.complementoMejora[idx] : 0});
    }
    return base;
  },
  // Residencia, Tutoría y Complemento de mejora son ×12-only en la fórmula anual de arriba (sin
  // término ×2) — no se cobran en la paga extra. Adicional Maestro ESO SÍ (ver nota en calc() arriba).
  pagaExtraItems(idx, anios, flags, d){
    const b = trunc(anios/3);
    const escal = sexenioStandard(anios, d.sexenio);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
    ];
    if (d.especificoAutonomico[idx] !== 0) items.push({label:'Complemento específico autonómico', monthly: d.especificoAutonomico[idx]});
    items.push({label:'Sexenios', monthly: escal});
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    if (si(flags.maestroESO) && d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: d.adicionalESO[idx]});
    return items;
  }
};

// ---------- ARAGÓN ----------
COMUNIDADES['Aragón'] = {
  overrides: {},
  salaryData: {
    destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
    // Corregido 2026-09-19 contra ANPE Aragón 2026: PTFP/Maestros TAPD (idx1-2) estaba en 740,23€,
    // el documento indica 746,39€ (confirmado también vía su "paga adicional = 90% del específico":
    // 746,39×0,9=671,75€, coincide exacto con el documento).
    especifico: arr9(740.23,746.39,746.39,756.22,756.22,756.22,756.22,762.09,808.69),
    // Complemento de cargo de Inspector ("puesto de inspector", 2026-09-20 a petición del usuario):
    // 850,18€, aparte del específico general — mismo patrón que Baleares/Cantabria/Extremadura/
    // Galicia/La Rioja. No se ve afectado por la reducción al 90% en paga extra (esa solo aplica al
    // específico y al sexenio, ver rules.reduccionPagaExtra).
    complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,850.18),
    sexenio: {sin:0, s1:96.53, s2:114.53, s3:143.73, s4:162.77, s5:60.09},
    tutoria: fill(0), // ANPE Aragón: aún no se cobra, pero se confirma que se empezará a cobrar — importe pendiente de conocer
    // Confirmado 2026-09-21, revisado a petición del usuario ("revisa Maestro ESO comunidad por
    // comunidad"): a diferencia de la mayoría, Aragón NO paga esto en ninguna de sus dos pagas
    // extraordinarias. El documento ANPE Aragón "RETRIBUCIONES (MENSUALES) — PAGAS EXTRAS Y
    // ADICIONALES" es explícito y exhaustivo sobre qué incluye cada una: la "paga extra" es
    // literalmente solo "sueldo base + trienios + complemento de destino", y la "paga adicional" es
    // "complemento específico (90%) + sexenios (90%)" — ninguna de las dos menciona el complemento de
    // Maestro en ESO en absoluto. Se deja ×12-only, a diferencia de Andalucía/Asturias/Baleares/
    // Cantabria/Castilla La Mancha/Castilla y León/Cataluña/Extremadura/Galicia/Madrid/Valencia/Ceuta
    // y Melilla (todas confirmadas SÍ lo pagan en la extra) y de La Rioja (confirmado por el usuario,
    // "12 mensualidades").
    adicionalESO: onlyF(139.7),
    complementoMejora: fill(0), productividad: fill(0),
    jefeDepartamento: fill(83.69), // ANPE Aragón: "Jefe de Departamento/Seminario/División, Coordinador de Especialidad": 83,69€/mes
  },
  // Corrected 2026-09-19 at the user's request: no hay complemento específico autonómico en Aragón,
  // ni una tabla de sexenios independiente para la paga extra. Lo que ocurre de verdad es que la paga
  // extra reduce AL 90% tanto el complemento específico como el sexenio del mes ordinario — un único
  // factor, no dos conceptos distintos — verificado comprobando que la antigua tabla sexenioExtra
  // equivale a sexenio × 0,9 en los 5 tramos (96,53×0,9=86,88 ✓, 114,53×0,9=103,08 ✓,
  // 143,73×0,9=129,36 ✓, 162,77×0,9=146,49 ✓, 60,09×0,9=54,08 ✓). Modelado ahora como parámetro
  // editable (antes hardcodeado como especificoAutonomicoFactor + una tabla sexenioExtra separada).
  rules: { reduccionPagaExtra: 0.9 },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const especificoExtra = d.especifico[idx]*rules.reduccionPagaExtra;
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const cargoInspector = d.complementoCargoInspector[idx];
    // Corregido 2026-09-19: la antigüedad sigue la escala estándar (sexenioStandard), sin ningún caso
    // especial de "sin sexenio" por cuerpo — ese importe es 0€ para todos los cuerpos en Aragón.
    const normal = sexenioStandard(anios, d.sexenio);
    const extra = normal * rules.reduccionPagaExtra;
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+cargoInspector)*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + (especificoExtra+cargoInspector)*2
      + d.extraTrienio[idx]*b*2
      + cargoAmt*14
      + jefeDept*14
      // Corrected 2026-09-19 at the user's request: Aragón's own formula gated adicionalESO/tutoría
      // on a column-F "s" literal (never equals the real selector value "SI"/"NO") — dead code, now
      // live like every other complement.
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      + (si(flags.tutor) ? d.tutoria[idx]*12 : 0)
      + (si(flags.carreraGeneral) ? d.complementoMejora[idx]*12 : 0) + d.productividad[idx]*2
      + normal*12
      + extra*2;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
      // El desglose de la paga extra (con el específico reducido al 90%) ahora vive en
      // pagaExtraItems() más abajo, no como item extraOnly aquí (evita duplicarlo).
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      items.push({label:'Sexenios', monthly: normal});
      if (d.complementoMejora[idx] !== 0) items.push({label:'Complemento de mejora', monthly: si(flags.carreraGeneral) ? d.complementoMejora[idx] : 0});
    }
    return base;
  },
  // Mismo quirk que Canarias (ver su propio pagaExtraAdjust): la fila "Sexenios" del bloque de paga
  // extra en la nómina mensual del Excel original repite el valor completo de la escala ordinaria en
  // vez de la escala reducida al 90% que la fórmula ANUAL sí usa — validado tal cual contra la
  // fixture. Reescrito para derivar la escala reducida a partir de sexenio×0,9 en vez de una tabla
  // sexenioExtra separada (matemáticamente idéntico, ver nota en `rules` de arriba).
  // Itemized version of the real paga extra (2026-09-21, a petición del usuario): without this, the
  // app's generic fallback double-counted "Complemento específico" — once as a naive full-rate
  // repeat of the ordinary item, AGAIN via the dedicated reduced-rate `especificoExtra` extraOnly
  // item above — producing a large negative "Ajuste" (exactly -especifico[idx], confirmed
  // numerically) to cancel out the spurious duplicate. Also silently over-counted "Adicional Maestro
  // ESO" and "Complemento de mejora" when active, neither of which has a ×2 term in calc(). This
  // lists only the real ×2-term concepts, so no "Ajuste" row is ever needed.
  pagaExtraItems(idx, anios, flags, d, rules){
    const b = trunc(anios/3);
    const especificoExtra = d.especifico[idx]*rules.reduccionPagaExtra;
    const cargoInspector = d.complementoCargoInspector[idx];
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const normal = sexenioStandard(anios, d.sexenio);
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico, reducido al 90%)', monthly: especificoExtra},
      {label:'Sexenios', monthly: normal},
      {label:'Productividad', monthly: d.productividad[idx]},
    ];
    if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    return items;
  },
  pagaExtraAdjust(idx, anios, flags, d, rules){
    const r = anios/6;
    const s = d.sexenio;
    let normal;
    if (idx===0){
      if (r>=5) normal = s.s1+s.s2+s.s3+s.s4+s.s5;
      else if (r>=4) normal = s.s1+s.s2+s.s3+s.s4;
      else if (r>=3) normal = s.s1+s.s2+s.s3;
      else if (r>=2) normal = s.s1+s.s2;
      else if (r>=1) normal = s.s1;
      else normal = 0;
    } else {
      if (r>=5) normal = s.s1+s.s2+s.s3+s.s4+s.s5;
      else if (r>=4) normal = s.s2+s.s3+s.s4+s.s5;
      else if (r>=3) normal = s.s1+s.s2+s.s3;
      else if (r>=2) normal = s.s1+s.s2;
      else if (r>=1) normal = s.s1;
      else normal = s.sin;
    }
    const factor = rules.reduccionPagaExtra;
    let extra;
    if (r>=5) extra = (s.s1+s.s2+s.s3+s.s4+s.s5)*factor;
    else if (r>=4) extra = (s.s1+s.s2+s.s3+s.s4)*factor;
    else if (r>=3) extra = (s.s1+s.s2+s.s3)*factor;
    else if (r>=2) extra = (s.s1+s.s2)*factor;
    else if (r>=1) extra = s.s1*factor;
    else extra = 0;
    return extra - normal;
  }
};

// ---------- ASTURIAS ----------
COMUNIDADES['Asturias'] = {
  overrides: { destino: arr9(598.09,736.54,736.54,736.54,736.54,736.54,736.54,882.19,882.19) },
  salaryData: {
    destino: arr9(598.09,736.54,736.54,736.54,736.54,736.54,736.54,882.19,882.19),
    especifico: arr9(708.37,708.37,708.37,708.37,708.37,708.37,708.37,770.9,1725.48),
    // "sin" (ANPE Asturias, "Complemento Personal Transitorio"): 113,85€/mes, lo cobra quien todavía
    // no tiene ningún sexenio, en vez de la escala habitual — no es un extra aparte, es el propio
    // importe "sin sexenio" de esta comunidad.
    sexenio: {sin:113.85, s1:120.17, s2:88.42, s3:117.87, s4:161.35, s5:47.46},
    tutoria: fill(0),
    adicionalESO: onlyF(138.45),
    evalDocenteA: arr9(164.68,164.68,164.68,257.3,257.3,257.3,257.3,257.3,257.3),
    evalDocenteB: arr9(329.36,329.36,329.36,514.6,514.6,514.6,514.6,514.6,514.6),
    // ANPE Asturias, "Jefe de Departamento": 82,95€/mes — listed under "Centros de Enseñanza
    // Secundaria, FP y Asimilados" specifically, so modeled as A1-group-only (idx3-8), matching how
    // "jefatura de departamento" doesn't structurally exist in Infantil/Primaria centres.
    jefeDepartamento: arr9(0,0,0,82.95,82.95,82.95,82.95,82.95,82.95),
  },
  rules: { tramoAminAnios: 5, tramoBminAnios: 10 },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const k = trunc(anios/6);
    const escal = sexenioStandard(anios, d.sexenio);
    // "Evaluación Docente / Carrera Profesional": gated por el interruptor "Carrera profesional"
    // (como en el resto de comunidades) y, si está activo, por los años de antigüedad (tramo A a
    // partir de 5 años, tramo B a partir de 10).
    const carrera = si(flags.carreraGeneral);
    const evalAmount = !carrera ? 0 : (anios >= rules.tramoBminAnios ? d.evalDocenteB[idx] : (anios >= rules.tramoAminAnios ? d.evalDocenteA[idx] : 0));
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx])*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx]+d.especifico[idx])*2
      + cargoAmt*14
      + d.extraTrienio[idx]*b*2
      + jefeDept*14
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      // Adicional Maestro ESO EN LA EXTRA (2026-09-21, revisado a petición del usuario, "comunidad
      // por comunidad"): a diferencia de la mayoría, en Asturias esto SÍ se paga en la extra —
      // fuentes confirman que el "Complemento Retributivo Nivelador" de Maestro/a 1er Ciclo ESO se
      // integra en las pagas de junio/diciembre, catorce mensualidades iguales (12 ordinarias + 2
      // extra), igual que el resto del complemento de destino/específico del que forma parte.
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*2 : 0)
      + escal*14
      + evalAmount*12;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      items.push({label: k===0 ? 'Complemento Personal Transitorio' : 'Sexenios', monthly: escal});
      // Known annual-vs-display divergence: the annual formula's own gate is anios>=tramo (5/10) —
      // kept in `monthly` so pagaExtraTotal derives correctly — but the source's separate "Nómina
      // mensual" display mirror cell uses a STRICT inequality (anios>tramo), confirmed against
      // fixture cases straddling anios=5 (case1: anios=5 excludes the item; case3: anios=8 includes
      // it). Display-only; annual formula stays untouched.
      const evalDisplay = !carrera ? 0 : (anios > rules.tramoBminAnios ? d.evalDocenteB[idx] : (anios > rules.tramoAminAnios ? d.evalDocenteA[idx] : 0));
      items.push({label:'Evaluación Docente / Carrera Profesional', monthly: evalAmount, displayMonthly: evalDisplay});
    }
    return base;
  },
  // Evaluación Docente/Carrera Profesional es ×12-only en la fórmula anual de arriba (sin término
  // ×2) — no se cobra en la paga extra. Confirmado 2026-09-22 (a petición del usuario, que dudaba de
  // esto): ANPE Asturias (anpeasturias.es/retribuciones) describe la paga extraordinaria como "el 100%
  // de todos los complementos específicos EXCEPTO el de productividad" — y este complemento aparece en
  // esa misma fuente marcado "(3) Incentivo de la Ley de Evaluación", es decir, es precisamente el
  // complemento de productividad/evaluación docente excluido. Adicional Maestro ESO SÍ (ver nota en calc() arriba).
  pagaExtraItems(idx, anios, flags, d, rules){
    const b = trunc(anios/3);
    const k = trunc(anios/6);
    const escal = sexenioStandard(anios, d.sexenio);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
      {label: k===0 ? 'Complemento Personal Transitorio' : 'Sexenios', monthly: escal},
    ];
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    if (si(flags.maestroESO) && d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: d.adicionalESO[idx]});
    return items;
  }
};

// ---------- BALEARES (Islas) ----------
COMUNIDADES['Baleares (Islas)'] = {
  // Updated 2026-09-20 from "Retribucions personal docent 2026" (Conselleria d'Educació, actualització
  // 01/09/2026): Complement de Destinació turned out to be the plain Ministry/generic scale (592,11 /
  // 729,14 / 873,38 by nivell) — matches GENERIC_DATA.destino exactly, so the old own-value override
  // (583.36/718.36/860.47, presumably a stale pre-raise figure) is removed rather than updated; Baleares
  // now inherits the generic table like most other comunidades, and the admin UI stops flagging it as a
  // "valor propio".
  salaryData: {
    // 457,75 general (la mayoría de cuerpos) · 519,62 "nivell 26" (Catedráticos, que tiene su propio
    // nivel de destino) · 554,31 (Complement Específic General inspectors) para Inspección — separado
    // 2026-09-20 de "C.Específic Singular Inspector" (994,16€), que ahora es su propio concepto
    // (complementoCargoInspector) en vez de sumarse aquí.
    especifico: arr9(457.75,457.75,457.75,457.75,457.75,457.75,457.75,519.62,554.31),
    complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,994.16),
    sexenio: {s1:69.48, s2:87.64, s3:116.79, s4:159.78, s5:47.06},
    tutoria: arr9(37.27,37.27,37.27,37.27,37.27,37.27,37.27,37.27,0),
    // "1r Cicle d'ESO" in the 2026 document (137,11€) is this same "Adicional Maestro ESO" concept
    // (Maestros impartiendo 1r cicle d'ESO), not a new one — just its updated figure.
    adicionalESO: onlyF(137.11),
    carreraTramo1: arr9(53.32,53.32,53.32,53.32,53.32,53.32,53.32,53.32,78.42),
    carreraTramo2: arr9(81.20,81.20,81.20,81.20,81.20,81.20,81.20,81.20,114.19),
    jefeDepartamento: arr9(0,82.20,82.20,82.20,82.20,82.20,82.20,82.20,0), // ANPE Balears: "Cap de departament / CEP": 82,20€/mes
  },
  rules: {
    // Complemento específico autonómico "carrera" seniority ladder (Carrera funcionarios only).
    // Interinos/prácticas get the flat ceaInterinoFlat regardless of años; Carrera has no separate
    // bracket below 1 año either, so anios<1 falls into ceaGe1 in calc() below.
    ceaInterinoFlat: 418.54,
    ceaGe1: 436.02, ceaGe6: 498.81, ceaGe12: 543.77,
    ceaGe18: 560.14, ceaGe24: 534.26, ceaGe30: 619.04,
    tramoUmbral1: 6, tramoUmbral2: 12,
    // Per the 2026 document, each island's real figure is TWO concepts summed: the base
    // "Indemnització Residència" (Mallorca 147,09/132,28 · Menorca+Eivissa share one bracket,
    // 226,72/215,98 · Formentera 298,28/287,53) plus that island's "complement de cobertura"
    // (Menorca 200,00 "difícil" · Eivissa 300,00 "difícil" · Formentera 416,15 "molt difícil",
    // shared with Menorca/Eivissa's higher tier but modeled here as Formentera's since it has no
    // separate "difícil" rate of its own). Mallorca has no cobertura supplement (it's the capital).
    residencia: {
      Mallorca: {A1:147.09, A2:132.28},
      Menorca: {A1:426.72, A2:415.98},
      Ibiza: {A1:526.72, A2:515.98},
      Formentera: {A1:714.43, A2:703.68}
    }
  },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const grp = groupOf(idx);
    const carrera = String(flags.funcionario||'').trim().toLowerCase()==='carrera';
    let cea;
    if (!carrera) cea = rules.ceaInterinoFlat;
    else if (anios>=30) cea = rules.ceaGe30;
    else if (anios>=24) cea = rules.ceaGe24;
    else if (anios>=18) cea = rules.ceaGe18;
    else if (anios>=12) cea = rules.ceaGe12;
    else if (anios>=6) cea = rules.ceaGe6;
    else cea = rules.ceaGe1; // ≥1 año, and also <1 año — Carrera has no separate bracket for that
    const island = flags.islaBaleares || 'Mallorca';
    let residencia;
    if (si(flags.islaNoCapitalina)) {
      residencia = (island==='Mallorca') ? 0 : (rules.residencia[island] ? rules.residencia[island][grp] : 0);
    } else {
      residencia = (island==='Mallorca') ? rules.residencia['Mallorca'][grp] : 0;
    }
    // Source quirk (Nómina mensual!row30 for Baleares): the DISPLAY row's own lookup keys purely on
    // the selected island (H10), not on the $C$10 "isla no capitalina" flag that gates the ANNUAL
    // formula's residencia term above. Confirmed against fixture cases with C10="NO" + a non-Mallorca
    // island (case3: Ibiza/A2, case8: Ibiza/A1): the annual total genuinely omits residencia there
    // (validated as-is, `residencia` stays untouched), but the monthly payslip still shows the
    // island's rate every month. `monthly` keeps the true (annual-matching) value; only
    // `residenciaDisplay` (used for `displayMonthly`) reflects the real per-island rate unconditionally.
    const residenciaDisplay = (island==='Mallorca') ? rules.residencia['Mallorca'][grp]
      : (rules.residencia[island] ? rules.residencia[island][grp] : 0);
    const s = d.sexenio;
    const k6 = trunc(anios/6);
    let sex12;
    if (k6>0 && k6<2) sex12 = s.s1;
    else if (k6>1 && k6<3) sex12 = s.s1+s.s2;
    else if (k6>2 && k6<4) sex12 = s.s1+s.s2+s.s3;
    else if (k6>3 && k6<5) sex12 = s.s1+s.s2+s.s3+s.s4;
    else if (k6>4) sex12 = s.s1+s.s2+s.s3+s.s4+s.s5;
    else sex12 = 0;
    // (An Excel-compatibility fallback for 36+ años de servicio, rules.fallback1398, applied here
    // before 2026-09-20 — removed at the user's request as undocumented; see the rules block above.)
    let sex2 = 0;
    if (k6>0 && k6<2) sex2 += s.s1;
    else if (k6>1 && k6<3) sex2 += s.s1+s.s2;
    else if (k6>2 && k6<4) sex2 += s.s1+s.s2+s.s3;
    else if (k6>3 && k6<5) sex2 += s.s1+s.s2+s.s3+s.s4;
    else if (k6>4) sex2 += s.s1+s.s2+s.s3+s.s4+s.s5;
    // Carrera profesional (2026-09-19): gated by the "Carrera profesional" toggle like every other
    // comunidad — off by default, and when on, uses this comunidad's own real logic (a threshold
    // ladder by años de servicio), not a flat figure.
    const carreraProfRaw = anios > rules.tramoUmbral2 ? d.carreraTramo2[idx]*12
                        : anios > rules.tramoUmbral1 ? d.carreraTramo1[idx]*12 : 0;
    const carreraProf = si(flags.carreraGeneral) ? carreraProfRaw : 0;
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const cargoInspector = d.complementoCargoInspector[idx];
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+cargoInspector+cea)*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + (d.especifico[idx]+cargoInspector+cea)*2
      + cargoAmt*14
      + jefeDept*14
      + d.extraTrienio[idx]*b*2
      + residencia*12
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      // Adicional Maestro ESO EN LA EXTRA (2026-09-21, revisado a petición del usuario, "comunidad
      // por comunidad"): el "1r cicle ESO" balear es la misma diferencia de complement de destinació
      // nivell 21→24 que en Cataluña/Andalucía/Extremadura/Valencia (137,11€ ≈ 137,03€ nacional), y
      // las fuentes confirman que la paga extraordinària se calcula como "sou base + triennis +
      // complement de destinació" sin reducir — así que la diferencia se cobra también en la extra.
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*2 : 0)
      + sex12*12
      // Corrected 2026-09-19 at the user's request: Baleares gated Tutoría on $C$7="s" (never equals
      // the real "SI"/"NO" selector value) — dead code, now live like every other complement.
      + (si(flags.tutor) ? d.tutoria[idx]*12 : 0)
      + sex2*2
      + carreraProf;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
      items.push({label:'Complemento específico autonómico (CEA)', monthly: cea});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (residencia !== 0 || residenciaDisplay !== 0) items.push({label:'Residencia', monthly: residencia, displayMonthly: residenciaDisplay});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      if (d.tutoria[idx] !== 0) items.push({label:'Tutoría', monthly: si(flags.tutor) ? d.tutoria[idx] : 0});
      items.push({label:'Sexenios', monthly: sex12});
      if (carreraProfRaw !== 0) items.push({label:'Carrera profesional', monthly: carreraProf/12});
    }
    return base;
  },
  // Residencia, Tutoría y Carrera profesional son ×12-only en la fórmula anual de arriba (sin
  // término ×2) — no se cobran en la paga extra. Confirmado 2026-09-22 (a petición del usuario, que
  // dudaba de esto para Carrera profesional): UGT-SP Balears (balears.ugt-sp.es, "Revisa la teva
  // Nòmina i Retribucions") describe la paga extraordinària como exactamente 5 componentes — % sueldo
  // base, % trienios, complemento específico general completo, complemento de destino completo y
  // sexenios completos — sin Carrera professional entre ellos. Nota: existe un litigio sindical activo
  // (STEI, sept. 2026, dbalears.cat) reclamando por vía judicial que SÍ se incluya — la Administración
  // aún no lo aplica así, así que el modelo actual sigue reflejando la nómina real vigente; revisar si
  // hay sentencia. Adicional Maestro ESO SÍ se cobra en la extra (ver nota en calc() arriba).
  pagaExtraItems(idx, anios, flags, d, rules){
    const b = trunc(anios/3);
    const carrera = String(flags.funcionario||'').trim().toLowerCase()==='carrera';
    let cea;
    if (!carrera) cea = rules.ceaInterinoFlat;
    else if (anios>=30) cea = rules.ceaGe30;
    else if (anios>=24) cea = rules.ceaGe24;
    else if (anios>=18) cea = rules.ceaGe18;
    else if (anios>=12) cea = rules.ceaGe12;
    else if (anios>=6) cea = rules.ceaGe6;
    else cea = rules.ceaGe1;
    const s = d.sexenio;
    const k6 = trunc(anios/6);
    let sex2 = 0;
    if (k6>0 && k6<2) sex2 = s.s1;
    else if (k6>1 && k6<3) sex2 = s.s1+s.s2;
    else if (k6>2 && k6<4) sex2 = s.s1+s.s2+s.s3;
    else if (k6>3 && k6<5) sex2 = s.s1+s.s2+s.s3+s.s4;
    else if (k6>4) sex2 = s.s1+s.s2+s.s3+s.s4+s.s5;
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const cargoInspector = d.complementoCargoInspector[idx];
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
    ];
    if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
    items.push({label:'Complemento específico autonómico (CEA)', monthly: cea});
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    items.push({label:'Sexenios', monthly: sex2});
    if (si(flags.maestroESO) && d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: d.adicionalESO[idx]});
    return items;
  }
};

// ---------- Generic "standard" community factory (Cantabria, CLM, CyL, Cataluña, Extremadura,
//            Madrid, Valencia, País Vasco share this skeleton) ----------
function makeStandard(sd, opts){
  opts = opts||{};
  return {
    overrides: opts.overrides||{},
    salaryData: sd,
    rules: opts.rules||{},
    calc(idx, anios, flags, cargoAmt, d, rules, today, items){
      const b = trunc(anios/3);
      // opts.s5ExcludeIdx: idx values whose "5º Sexenio" cell is NOT chained (blank/0) in the
      // source — e.g. Cantabria's row210 only chains F:M, column N (510-Inspección) stays blank.
      const sexTable = (opts.s5ExcludeIdx && opts.s5ExcludeIdx.includes(idx))
        ? { ...d.sexenio, s5: 0 } : d.sexenio;
      // opts.sexenioSinPersists (2026-09-22, País Vasco): see the comment on sexenioStandard's
      // sinPersists parameter — País Vasco's "sin sexenio" cell holds a real, unconditional
      // capitalización that keeps being paid once real tramos accrue, not a placeholder.
      const sexAnual = sexenioStandard(anios, sexTable, opts.sexenioSinPersists);
      // opts.tutoriaInExtra (2026-09-21, Extremadura): most comunidades' Tutoría is ×12-only, but
      // Extremadura's own official table ("Retribuciones del Personal Docente 2026", Dirección General
      // Personal Docente) lists an explicit "Mensual" / "P.A.C.E." (paga adicional de carácter
      // extraordinario) column pair for every concept, Tutoría included, and the two are equal
      // (49,66€ / 49,66€) — confirmed paid at full rate in the paga extra there, unlike the default.
      const tutorOn = opts.tutorAlwaysOn ? true : si(flags.tutor);
      const tutorTerm = tutorOn ? d.tutoria[idx]*12 : 0;
      const tutorExtra = (opts.tutoriaInExtra && tutorOn) ? d.tutoria[idx]*2 : 0;
      // adicionalESO is ×12-only (never in the paga extra) by default — confirmed explicitly for La
      // Rioja ("12 mensualidades" per the user, reading directly from its own source) and matching the
      // Aragón -768.35€ Ajuste fix from 2026-09-21 (undercounted ×11 instead of ×12 before that fix).
      // opts.adicionalESOInExtra (2026-09-21) flips this for comunidades whose own source shows it IS
      // paid in the extra: Extremadura's table (see tutorOn above) shows 137,03€ Mensual = 137,03€
      // P.A.C.E. for "Maestros en 1er ciclo E.S.O. (COMPL. RETRIBUTIVO NIVELADOR)"; Valencia's own ANPE
      // "Calcula tu nómina" card models this as a genuine reassignment of Complemento de destino (a
      // "Maestros ESO" row with destino=729,14€, not a separate additive line), and its own paga-extra
      // formula ("Sueldo base + Complemento de destino + Complemento específico + Trienios") includes
      // destino unreduced — so the higher destino carries into the extra there too.
      const adicOn = si(flags.maestroESO);
      const adic = adicOn ? d.adicionalESO[idx]*12 : 0;
      const adicExtra = (opts.adicionalESOInExtra && adicOn) ? d.adicionalESO[idx]*2 : 0;
      const cea = d.especificoAutonomico ? d.especificoAutonomico[idx] : 0;
      // Complemento de cargo de Inspector (2026-09-20): several comunidades' documents pay Inspección
      // a distinct "cargo" rate on top of whatever concept (específico/autonómico) it shares with
      // every other cuerpo — previously lumped into that shared field for Inspección's row alone,
      // now split into its own field/item so each concept is what its label says.
      const cargoInspector = d.complementoCargoInspector ? d.complementoCargoInspector[idx] : 0;
      // Jefe de departamento / coordinación (2026-09-19): a flat stipend, independent of the regular
      // cargo directivo (Dirección/Jefatura de Estudios/Secretaría) selector — a teacher can hold
      // both roles. Paid across all 14 pagas like cargo directivo, per the community sources that
      // document it (Asturias/Cantabria/Galicia). 0€ for communities without a known figure yet.
      const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx]*14 : 0;
      // "Carrera profesional" toggle (2026-09-19, corrected): gates the pre-existing "complemento de
      // mejora" field — not a separate new concept. Off by default; when on, pays whatever value that
      // comunidad already has stored there (0€ for most, a real figure for a few, e.g. Castilla y León).
      // opts.complementoMejoraAlwaysOn (2026-09-20, Castilla y León): this field is actually an
      // unconditional "Consolidación punto 4º" there, per the document's own mensualidades table — it
      // has nothing to do with carrera profesional, so it's paid every month regardless of the toggle.
      const mejoraOn = opts.complementoMejoraAlwaysOn ? true : si(flags.carreraGeneral);
      const mejoraLabel = opts.complementoMejoraLabel || 'Complemento de mejora';
      const carreraMejora = (d.complementoMejora && mejoraOn) ? d.complementoMejora[idx]*12 : 0;
      // "Residencia Vall d'Aran" (Cataluña, 2026-09-20): a geographic complement like other comunidades'
      // island residencia, paid only when the profile explicitly works in that comarca — its own flag
      // (flags.vallAran), not the Canarias/Baleares islaNoCapitalina one, since it's a different concept.
      const vallAran = (d.residenciaVallAran && si(flags.vallAran)) ? d.residenciaVallAran[idx] : 0;
      let base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+cargoInspector+cea)*12
        + d.trienios[idx]*b*12
        + (d.extraSueldoBase[idx]+d.destino[idx])*2
        + (d.especifico[idx]+cargoInspector+cea)*2
        + cargoAmt*14
        + d.extraTrienio[idx]*b*2
        + adic
        + adicExtra
        + sexAnual*12
        + tutorTerm
        + tutorExtra
        + sexAnual*2
        + jefeDept
        + carreraMejora
        + vallAran*12;
      if (opts.finalTerms) base += opts.finalTerms(idx, anios, flags, d);
      if (items){
        items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
        if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
        items.push({label:'Complemento de destino', monthly: d.destino[idx]});
        items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
        if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
        if (cea !== 0) items.push({label:'Complemento específico autonómico', monthly: cea});
        items.push({label:'Cargo directivo', monthly: cargoAmt});
        if (d.adicionalESO && d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO',
          monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
        items.push({label:'Sexenios', monthly: sexAnual});
        if (d.tutoria && d.tutoria[idx] !== 0) items.push({label:'Tutoría',
          monthly: opts.tutorAlwaysOn ? d.tutoria[idx] : (si(flags.tutor) ? d.tutoria[idx] : 0)});
        if (d.complementoMejora && d.complementoMejora[idx] !== 0) items.push({label:mejoraLabel, monthly: mejoraOn ? d.complementoMejora[idx] : 0});
        if (d.carreraProfesional && d.carreraProfesional[idx] !== 0) items.push({label:'Carrera profesional', monthly: d.carreraProfesional[idx]});
        if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación',
          monthly: si(flags.jefeDepartamento) ? d.jefeDepartamento[idx] : 0});
        if (d.residenciaVallAran && d.residenciaVallAran[idx] !== 0) items.push({label:'Residencia (Vall d\'Aran)',
          monthly: si(flags.vallAran) ? d.residenciaVallAran[idx] : 0});
      }
      return base;
    },
    // Itemized version of the real paga extra (2026-09-21, a petición del usuario): Complemento de
    // mejora ("Carrera Profesional/Productividad" o "Consolidación punto 4º") y Residencia Vall d'Aran
    // son siempre ×12-only en la fórmula anual de arriba — SIN término ×2 — así que nunca se cobran en
    // la paga extra. Tutoría y Adicional Maestro ESO son ×12-only POR DEFECTO (confirmado
    // explícitamente para La Rioja, "12 mensualidades" según su propia fuente) salvo que
    // opts.tutoriaInExtra/opts.adicionalESOInExtra digan lo contrario para esta comunidad en concreto
    // (ver calc() arriba). El mecanismo genérico de la app los repetía igualmente cuando estaban
    // activos, exigiendo un "Ajuste" negativo para cancelar el sobrante (confirmado en Cataluña:
    // -104,83€ = residenciaVallAran[idx] exacto). Todo lo demás (sueldo/trienio a su tasa propia,
    // destino, específico+singular+autonómico, sexenios, jefe de departamento) sí se paga a la misma
    // tasa que el mes ordinario.
    pagaExtraItems(idx, anios, flags, d){
      const b = trunc(anios/3);
      const sexTable = (opts.s5ExcludeIdx && opts.s5ExcludeIdx.includes(idx))
        ? { ...d.sexenio, s5: 0 } : d.sexenio;
      const sexAnual = sexenioStandard(anios, sexTable, opts.sexenioSinPersists);
      const cea = d.especificoAutonomico ? d.especificoAutonomico[idx] : 0;
      const cargoInspector = d.complementoCargoInspector ? d.complementoCargoInspector[idx] : 0;
      const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
      const items = [
        {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
        {label:'Trienios', monthly: d.extraTrienio[idx]*b},
        {label:'Complemento de destino', monthly: d.destino[idx]},
        {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
      ];
      if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
      if (cea !== 0) items.push({label:'Complemento específico autonómico', monthly: cea});
      items.push({label:'Sexenios', monthly: sexAnual});
      if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      // opts.adicionalESOInExtra / opts.tutoriaInExtra (2026-09-21): see the matching comments in
      // calc() above — only true for comunidades whose own source confirms it (Extremadura both,
      // Valencia adicionalESO only).
      if (opts.adicionalESOInExtra && si(flags.maestroESO) && d.adicionalESO && d.adicionalESO[idx] !== 0){
        items.push({label:'Adicional Maestro ESO', monthly: d.adicionalESO[idx]});
      }
      const tutorOn = opts.tutorAlwaysOn ? true : si(flags.tutor);
      if (opts.tutoriaInExtra && tutorOn && d.tutoria && d.tutoria[idx] !== 0){
        items.push({label:'Tutoría', monthly: d.tutoria[idx]});
      }
      return items;
    }
  };
}

// ---------- CANTABRIA ----------
// Corrected 2026-09-19 against the official ANPE Cantabria retribuciones table (actualizado
// 24/07/2026): every "Complemento específico" figure was 60,23€ below the current official amount
// (875.10→935.33 for Maestros/PES/Secundaria/EOI/Conservatorio/Artes, 940.27→1000.50 for
// Catedráticos) — the source document notes a further raise applies from September's payslip, so
// our master data was simply from before this year's increase. Inspección's new figure (1062.5+
// 60.23=1122.73) is extrapolated from the same flat delta, since the source table doesn't itemize
// Inspección separately — worth double-checking directly if a dedicated reference turns up.
// Corregido 2026-09-19 contra anpecantabria.es/retribuciones: el 5º sexenio de Inspección estaba
// forzado a 0 (s5ExcludeIdx) por un fallo del Excel original — el documento no distingue a Inspección
// del resto de cuerpos para los sexenios, así que se quita esa exclusión.
// Corregido 2026-09-20 a petición del usuario: el "1122,73€" de específico para Inspección era una
// extrapolación (ver historial); el valor real es 1.140,46€ — lo que antes se guardaba como
// "especificoAutonomico" exclusivo de Inspección era en realidad el específico básico mal etiquetado
// (Cantabria no tiene CEA real). Además hay un "complemento de puesto" distinto, 1.062,50€, separado
// como complementoCargoInspector (mismo patrón que Baleares/Extremadura/Galicia/La Rioja).
COMUNIDADES['Cantabria'] = makeStandard({
  destino: arr9(623.22,767.49,767.49,767.49,767.49,767.49,767.49,919.32,919.32),
  especifico: arr9(935.33,935.33,935.33,935.33,935.33,935.33,935.33,1000.5,1140.46),
  complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,1062.50),
  // "sin" (ANPE Cantabria, "Componente de fomento a la formación"): 35,77€/mes, en vez del importe
  // habitual "sin sexenio".
  sexenio: {sin:35.77, s1:108.86, s2:92.21, s3:122.88, s4:168.17, s5:49.51},
  tutoria: fill(0),
  adicionalESO: onlyF(144.34),
  complementoMejora: fill(0), productividad: fill(0),
  jefeDepartamento: fill(86.5), // ANPE Cantabria, "Jefe/a de Departamento": 86,50€/mes
}, { overrides: { destino: arr9(623.22,767.49,767.49,767.49,767.49,767.49,767.49,919.32,919.32) },
  finalTerms:(idx,anios,flags,d)=> d.productividad[idx]*2,
  // adicionalESOInExtra (2026-09-21, a petición del usuario, "revisa comunidad por comunidad"):
  // fuentes confirman que en Cantabria los maestros en 1er ciclo de ESO cobran el complemento de
  // destino de nivel 24 (767,49€ propio de Cantabria) en vez del nivel 21 (623,22€) — la diferencia,
  // 144,34€, es este mismo "Complemento Retributivo Nivelador" — y que las pagas extraordinarias
  // incluyen "la suma del resto de complementos", sin excepción para este.
  adicionalESOInExtra: true,
});

// ---------- CASTILLA LA MANCHA ----------
// Corrected 2026-09-19 against el boletín oficial ANPE Castilla-La Mancha 2026: específico y los 5
// sexenios estaban entre un 4% y un 5% por debajo del importe oficial vigente en todos los cuerpos
// (probablemente una subida de 2026 no reflejada en el Excel original) — corregidos a los importes
// reales. El complemento específico autonómico (JCCM) es, según el documento, el MISMO importe para
// todos los cuerpos sin excepción, incluida Inspección (612,61€) — no hay que combinarlo con nada más.
// Re-verificado 2026-09-21 (a petición del usuario, "busca otra normativa de Castilla la Mancha, esa
// no dice nada") contra la Orden 194/2025, de 29 de diciembre, de la Consejería de Hacienda,
// Administraciones Públicas y Transformación Digital (DOCM núm. 3, 07-01-2026), Anexo III —
// "Conceptos retributivos del personal docente no universitario y del personal docente con función
// inspectora", el documento oficial de la Junta que sí trae cifras reales (a diferencia de la página
// de educacion.castillalamancha.es enlazada antes, que solo tenía dos normas puntuales sin tablas).
// Confirma EXACTO: especifico+especificoAutonomico suman el "componente general" del anexo por cuerpo
// (294,82+612,61=907,43€ Maestros/PTFP/Secundaria; 357,47+612,61=970,08€ Catedráticos;
// 392,55+612,61=1.005,16€ Inspección), complementoCargoInspector ("Inspector/a de Educación",
// 1.095,71€), los 5 tramos de sexenio, adicionalESO ("Complemento de Maestros/as en IES", 143,50€),
// jefeDepartamento (83,24€) y la tabla de cargo directivo CEIP/CRA completa (la de Secundaria tenía un
// error real, ver CARGO_RAW). Añadido como fuente oficial en META (index.html), junto a la página
// original.
COMUNIDADES['Castilla La Mancha'] = makeStandard({
  destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
  especifico: arr9(294.82,294.82,294.82,294.82,294.82,294.82,294.82,357.47,392.55),
  // Complemento específico singular (2026-09-20, a petición del usuario; antes "Complemento de cargo
  // de Inspector"): 1.095,71€, aparte del específico y del autonómico — mismo patrón que Aragón/
  // Baleares/Cantabria/Extremadura/Galicia/La Rioja.
  complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,1095.71),
  especificoAutonomico: fill(612.61),
  sexenio: {sin:0, s1:94.46, s2:88.74, s3:118.26, s4:161.82, s5:62.12},
  tutoria: fill(0),
  adicionalESO: onlyF(143.5), // ANPE Castilla-La Mancha: "Maestro/a en IES" (puesto singular)
  complementoMejora: fill(0), productividad: fill(0),
  jefeDepartamento: arr9(0,83.24,83.24,83.24,83.24,83.24,83.24,83.24,0), // ANPE Castilla-La Mancha: "Jefe/a de Departamento": 83,24€/mes
  // "Complemento de Itinerancia": el documento lo escalona por kilómetros recorridos semanalmente
  // (17,65€ de 0-50km hasta 176,59€ de 451km en adelante), no por un importe fijo. Se usa aquí el
  // tramo intermedio "de 151 a 200 km" (70,64€) como valor representativo — no está modelado el
  // escalado real por kilometraje, ver nota en Datos CCAA.
}, { finalTerms:(idx,anios,flags,d)=> d.productividad[idx]*2,
  // adicionalESOInExtra (2026-09-21, a petición del usuario, "revisa comunidad por comunidad"):
  // guías sindicales (FeSP-UGT CLM) confirman que "el complemento específico... se incluye en las
  // pagas extraordinarias de junio y diciembre, a diferencia de otros funcionarios" — este "Maestro/a
  // en IES" es, por Decreto 47/2020, un componente singular del específico, así que le aplica la
  // misma regla. Confianza algo menor que en otras comunidades (la fuente confirma la regla general
  // del específico, no cita este componente en concreto por su nombre).
  adicionalESOInExtra: true,
});

// ---------- CASTILLA Y LEÓN ----------
// Corrected 2026-09-20 contra la ORDEN PRE/1/2026 (BOCyL 05-01-2026): el "C. COMUNIDAD" de Inspección
// (1.036,51€) estaba lumped — el documento distingue "C. COMUNIDAD" (234,63€, columna Inspectores) del
// complemento por "Desempeño de puestos de Función Inspectora" (801,88€ para "Inspectores de Educación",
// la fila base sin cargo jefe/coordinador), que ahora es su propio complementoCargoInspector
// (234.63+801.88=1036.51, cuadra con el valor previamente lumped).
// Converted from makeStandard() to hand-coded (2026-09-20, at the user's request) to model Castilla y
// León's real "Carrera profesional" mechanism, per la Ley 7/2019 (BOCYL 26/03/2019) and CSIF Educación
// CyL (csif.es/es/articulo/castillayleon/educacion/83250): a teacher must CHOOSE between sexenios and
// carrera profesional — opting into carrera means losing the sexenios entirely, not stacking both.
// Categorías C1-C4 accrue cumulatively (reaching C3 pays C1+C2+C3, same chaining style as sexenios),
// unlocking at 5/10/16/23 años de servicio respectively (rules.carreraTramoUmbral1-4). When "Carrera
// profesional" is on, this app pays whichever total is higher — carrera or sexenios — matching the
// real-world "pasarela" choice (reversible up to 5 times per the same source); the loser is 0€. When
// the toggle is off, sexenios apply as usual, exactly like every other comunidad.
// Checked 2026-09-20 against a second, more detailed UGT/BOCyL infographic of the same ORDEN PRE/1/2026:
// confirmed the "Consolidación punto 4º" name/values and that it's excluded from paga extra (already
// modeled that way); corrected 1º sexenio (70,21€, not 70,22€) and Categoría 3/A1 (523,62€, not
// 523,60€ — its own annual figure, 7.330,68€, only checks out at 523,62×14); "Función Tutorial" (20€)
// no aparecía en este documento (ORDEN PRE/1/2026) y se retiró en su momento — reinstaurada 2026-09-22
// como "Tutoría" a raíz de un acuerdo posterior (julio 2026, ver nota junto a `tutoria` más abajo).
COMUNIDADES['Castilla y León'] = {
  overrides: {},
  salaryData: {
    destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
    especifico: arr9(294.2,294.2,294.2,294.2,294.2,294.2,294.2,356.73,391.75),
    // Complemento específico singular (antes "Complemento de cargo de Inspector"): 801,88€.
    complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,801.88),
    especificoAutonomico: arr9(423.45,423.45,423.45,424.79,424.79,424.79,424.79,424.79,234.63),
    // Corrected 2026-09-20 against the UGT/BOCyL infographic (más completo que el documento ANPE
    // usado antes): 1º sexenio es 70,21€, no 70,22€ (1 céntimo).
    sexenio: {sin:0, s1:70.21, s2:88.56, s3:124.87, s4:251.87, s5:144.8},
    // "Tutoría" (2026-09-22, a petición del usuario): reinstaurada — un acuerdo nuevo de julio 2026
    // (CSIF/ANPE/STECyL-i con la Consejería de Educación) crea este complemento por primera vez, vigente
    // desde el 1/09/2026, con subida progresiva por curso: 20€/mes (2026-27), 40€/mes (2027-28), 60€/mes
    // (2028-29). Se usa aquí el importe del primer curso (20€); sin cifra por cuerpo desglosada en la
    // fuente (nota de prensa, no el propio acuerdo/BOCyL), así que se aplica plana a todos los cuerpos
    // docentes salvo Inspección (igual que el resto de comunidades); su tratamiento en paga extra
    // tampoco está confirmado, así que se deja ×12-only (comportamiento por defecto). Pendiente de
    // revisar cuando se publique el texto oficial o suba de tramo.
    tutoria: arr9(20,20,20,20,20,20,20,20,0),
    // Corrected 2026-09-20 against ORDEN PRE/1/2026 (BOCyL 05-01-2026): antes 133,20€, real 138,58€
    // ("Maestros que imparten docencia en 1º y 2º curso de la ESO").
    adicionalESO: onlyF(138.58),
    // "Consolidación punto 4º" (2026-09-20, at the user's request): an unconditional monthly item in
    // the document's own mensualidades table (labelled "PRODUCTIVIDAD" there) — nothing to do with
    // carrera profesional, paid every month regardless of the "Carrera profesional" switch.
    complementoMejora: arr9(25.27,25.27,25.27,27.04,27.04,27.04,27.04,27.04,27.04),
    productividad: fill(0),
    jefeDepartamento: arr9(0,83.08,83.08,83.08,83.08,83.08,83.08,83.08,0), // ANPE Castilla y León: "Jefe de Departamento (Secundaria, FP y Régimen Especial)": 83,08€/mes
    // Tabla real "Carrera profesional" (categorías/tramos C1-C4), Acuerdo de 25/08/2021 (BOCYL
    // 02/09/2021): importes mensuales por categoría, acumulativos según años de servicio.
    // Categoría 3 (A1) corregida 2026-09-20 contra el UGT/BOCyL: 523,62€, no 523,60€ (su propio
    // importe anual, 7.330,68€, solo cuadra con 523,62×14).
    carreraTramoC1: arr9(153.11,153.11,153.11,201.43,201.43,201.43,201.43,201.43,201.43),
    carreraTramoC2: arr9(275.54,275.54,275.54,362.54,362.54,362.54,362.54,362.54,362.54),
    carreraTramoC3: arr9(397.96,397.96,397.96,523.62,523.62,523.62,523.62,523.62,523.62),
    carreraTramoC4: arr9(520.41,520.41,520.41,684.73,684.73,684.73,684.73,684.73,684.73),
  },
  rules: { carreraTramoUmbral1: 5, carreraTramoUmbral2: 10, carreraTramoUmbral3: 16, carreraTramoUmbral4: 23 },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const cea = d.especificoAutonomico[idx];
    const cargoInspector = d.complementoCargoInspector[idx];
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx]*14 : 0;
    const carreraMejora = d.complementoMejora[idx]*12; // "Consolidación punto 4º", always on
    const carreraOn = si(flags.carreraGeneral);
    let carreraTotal = 0;
    if (carreraOn){
      if (anios >= rules.carreraTramoUmbral4) carreraTotal = d.carreraTramoC1[idx]+d.carreraTramoC2[idx]+d.carreraTramoC3[idx]+d.carreraTramoC4[idx];
      else if (anios >= rules.carreraTramoUmbral3) carreraTotal = d.carreraTramoC1[idx]+d.carreraTramoC2[idx]+d.carreraTramoC3[idx];
      else if (anios >= rules.carreraTramoUmbral2) carreraTotal = d.carreraTramoC1[idx]+d.carreraTramoC2[idx];
      else if (anios >= rules.carreraTramoUmbral1) carreraTotal = d.carreraTramoC1[idx];
    }
    // Elegir sexenios o carrera profesional (no ambos) — la que sea más alta se cobra, la otra queda a 0.
    const useCarrera = carreraOn && carreraTotal > sexAnual;
    const sexPagado = useCarrera ? 0 : sexAnual;
    const carreraPagado = useCarrera ? carreraTotal : 0;
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+cargoInspector+cea)*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + (d.especifico[idx]+cargoInspector+cea)*2
      + cargoAmt*14
      + d.extraTrienio[idx]*b*2
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      // Adicional Maestro ESO EN LA EXTRA (2026-09-21, revisado a petición del usuario, "comunidad por
      // comunidad"): fuentes (UGT/BOCyL) confirman explícitamente que este "componente compensatorio
      // del específico" para Maestros de 1º/2º de ESO "también se incluye en cada paga extraordinaria".
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*2 : 0)
      + sexPagado*12
      + (si(flags.tutor) ? d.tutoria[idx]*12 : 0)
      + sexPagado*2
      + jefeDept
      + carreraMejora
      + carreraPagado*12
      + carreraPagado*2
      + d.productividad[idx]*2;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
      if (cea !== 0) items.push({label:'Complemento específico autonómico', monthly: cea});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      if (useCarrera) items.push({label:'Carrera profesional', monthly: carreraPagado});
      else items.push({label:'Sexenios', monthly: sexPagado});
      if (d.tutoria[idx] !== 0) items.push({label:'Tutoría', monthly: si(flags.tutor) ? d.tutoria[idx] : 0});
      if (d.complementoMejora[idx] !== 0) items.push({label:'Consolidación punto 4º', monthly: d.complementoMejora[idx]});
      if (d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: si(flags.jefeDepartamento) ? d.jefeDepartamento[idx] : 0});
    }
    return base;
  },
  // Itemized version of the real paga extra (2026-09-21, a petición del usuario): "Consolidación
  // punto 4º" (complementoMejora) and "Adicional Maestro ESO" are both ×12-only in la fórmula anual
  // (sin término ×2) — el mecanismo genérico de la app los repetía igualmente en la extra, exigiendo
  // un "Ajuste" negativo (-complementoMejora[idx], confirmado numéricamente) para cancelar el sobrante.
  // Todo lo demás (sueldo/trienio a su tasa propia, destino, específico+singular+autonómico,
  // sexenios/carrera profesional, jefe de departamento) sí se paga a la misma tasa que el mes
  // ordinario, así que se repite tal cual.
  pagaExtraItems(idx, anios, flags, d, rules){
    const b = trunc(anios/3);
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const cea = d.especificoAutonomico[idx];
    const cargoInspector = d.complementoCargoInspector[idx];
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const carreraOn = si(flags.carreraGeneral);
    let carreraTotal = 0;
    if (carreraOn){
      if (anios >= rules.carreraTramoUmbral4) carreraTotal = d.carreraTramoC1[idx]+d.carreraTramoC2[idx]+d.carreraTramoC3[idx]+d.carreraTramoC4[idx];
      else if (anios >= rules.carreraTramoUmbral3) carreraTotal = d.carreraTramoC1[idx]+d.carreraTramoC2[idx]+d.carreraTramoC3[idx];
      else if (anios >= rules.carreraTramoUmbral2) carreraTotal = d.carreraTramoC1[idx]+d.carreraTramoC2[idx];
      else if (anios >= rules.carreraTramoUmbral1) carreraTotal = d.carreraTramoC1[idx];
    }
    const useCarrera = carreraOn && carreraTotal > sexAnual;
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
    ];
    if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
    if (cea !== 0) items.push({label:'Complemento específico autonómico', monthly: cea});
    items.push(useCarrera ? {label:'Carrera profesional', monthly: carreraTotal} : {label:'Sexenios', monthly: sexAnual});
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    if (si(flags.maestroESO) && d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: d.adicionalESO[idx]});
    return items;
  }
};

// ---------- CATALUÑA ----------
// Corrected 2026-09-20 against the official Generalitat spreadsheet (educacio.gencat.cat,
// taules-retributives.xlsx, fulls "BASE 2026"/"SINGULARS 2026") and a third source, CCOO Educació's
// "horaris i retribucions" full-table PDF (ccoo.cat, febrer 2026), which independently matches every
// figure below: sueldo base/específico ya coincidían exactos; corregidos los tramos 2º y 5º de
// sexenios ("Estadis"), que la web de ANPE Catalunya tenía con un pequeño error (135,54€ y 145,65€
// reales, no 136,54€/145,85€). Inspección especifico corregido a 720,83€ (el mismo "component
// general" que comparte con el resto de cuerpos, no el valor lumped anterior de 1.002,89€) más su
// propio complementoCargoInspector, 1.476,25€ ("Component singular lloc inspector" — el rango base,
// no coordinador/cap). Inspección destino corregido a 873,38€ (2026-09-20): ni el XLSX oficial ni el
// PDF de CCOO dan una fila de destino propia para Inspección, pero dos fuentes web (Resolució
// EDU/3027/2020, que aprova la RLT de la Inspecció d'Educació) confirman que el cos està classificat
// en grup A1, nivell 26 — el mateix nivell que Catedràtics — no el valor previo de 1.022,22€, que no
// corresponde a ningún nivel real de la escala de destino nacional (nivel 27=995,47€, nivel
// 28=1.041,22€) y rompía el patrón que sigue el resto de comunidades (Inspección siempre comparte
// destino con Catedráticos). Con esta corrección el destino de Cataluña coincide en las 9 columnas
// con GENERIC_DATA.destino, así que se retira el override (era específico solo de la columna
// Inspección) — mismo criterio aplicado antes a Baleares — y la UI deja de marcarlo como "valores
// propios". Tabla de cargo directivo completamente actualizada (ver CARGO_RAW). Añadido el
// "Complement d'indemnització de la Vall d'Aran" como residencia, gated por su propio interruptor
// (75,56€ Mestres / 104,83€ Secundaria+).
COMUNIDADES['Cataluña'] = makeStandard({
  destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
  especifico: arr9(704.95,720.83,720.83,720.83,720.83,720.83,720.83,785.45,720.83),
  complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,1476.25),
  especificoAutonomico: fill(0),
  sexenio: {sin:0, s1:128.88, s2:135.54, s3:153.66, s4:166.39, s5:145.65},
  tutoria: arr9(66.56,93.6,93.6,93.6,93.6,93.6,93.6,93.6,0),
  adicionalESO: onlyF(137.03),
  complementoMejora: fill(0), productividad: fill(0),
  jefeDepartamento: fill(93.6), // ANPE Catalunya, "Cap de Departament": 93,60€/mes
  // "Complement d'indemnització de la Vall d'Aran": Mestres 75,56€/mes, Secundaria i resta 104,83€/mes.
  residenciaVallAran: arr9(75.56,75.56,75.56,104.83,104.83,104.83,104.83,104.83,104.83),
}, { overrides: {},
  finalTerms:(idx,anios,flags,d)=> d.productividad[idx]*2,
  // adicionalESOInExtra (2026-09-21, a petición del usuario, "revisa comunidad por comunidad"): el
  // "1r Cicle d'ESO" catalán es, igual que en Andalucía/Extremadura/Valencia, una compensación por la
  // diferencia entre el Complement de Destinació nivell 21 i nivell 24 (no un plus aparte) — fuentes
  // sindicales confirman que la paga extraordinària es "sou base + triennis + complement de
  // destinació", sin reducir este último, así que la diferencia se cobra también en la extra.
  adicionalESOInExtra: true,
  // tutoriaInExtra (2026-09-22, a petición del usuario, "las tutorías deberían ser iguales para
  // todos" — verificado comunidad por comunidad en vez de uniformar a ciegas): ASPEPC·SPS (secundaria.
  // info/docu/professorat:retribucions:paga1), a partir de una nómina real, confirma que la paga
  // extraordinària catalana incluye el "complement singular (tutoria)" — 93,60€ para tutoría de ESO,
  // la misma cifra ya usada en `tutoria` arriba — a diferencia del supuesto ×12-only por defecto.
  tutoriaInExtra: true,
});

// ---------- EXTREMADURA ----------
COMUNIDADES['Extremadura'] = makeStandard({
  destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
  // Updated 2026-09-20 from the official "Retribuciones del Personal Docente" (Junta de Extremadura,
  // Acuerdo 13/01/2026): general 544,43€ · Catedráticos 605,09€ · Inspección 639,11€.
  especifico: arr9(544.43,544.43,544.43,544.43,544.43,544.43,544.43,605.09,639.11),
  // Complemento específico singular (antes "Complemento de cargo de Inspector"): 610,22€, de la
  // tabla separada "INSPECCIÓN EDUCATIVA", no forma parte del CEA (ver nota bajo especificoAutonomico).
  complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,610.22),
  // CEA corrected 2026-09-20 at the user's request: 270,29€ is flat for EVERY cuerpo (Maestros/PTFP/
  // TAPD included, not just Secundaria and up) — including Inspección, whose "Inspector/a" figure
  // (above) is its own concept, not part of the CEA.
  // Corrected 2026-09-22 (a petición del usuario, "corrige con lo del documento"): la auditoría de
  // procedencia detectó que el documento oficial ("Retribuciones del Personal Docente 2026", Junta de
  // Extremadura) trae una cifra de CEA propia y distinta para Inspección — 434,85€ — en vez del
  // 270,29€ plano que comparten el resto de cuerpos.
  especificoAutonomico: arr9(270.29,270.29,270.29,270.29,270.29,270.29,270.29,270.29,434.85),
  // Sexenio periods updated to the document's "Complemento Específico por Formación Permanente".
  sexenio: {sin:0, s1:68.14, s2:85.95, s3:114.51, s4:156.67, s5:46.18},
  // "Tutoría ENSEÑANZA SECUNDARIA OBLIGATORIA" — actualizado 2026-09-20 (antes 47,72€).
  tutoria: arr9(0,0,0,49.66,49.66,49.66,49.66,49.66,0),
  // "Maestros en 1er ciclo E.S.O. (Complemento Retributivo Nivelador)" — actualizado 2026-09-20 con
  // el importe fijo del documento (137,03€); coincide exactamente con lo que salía calculado antes
  // como destino[Secundaria]-destino[Maestros], así que el resultado no cambia, pero ahora es el
  // valor real y documentado, no una coincidencia derivada.
  adicionalESO: onlyF(137.03),
  complementoMejora: fill(0), productividad: fill(0),
  jefeDepartamento: arr9(80.6,80.6,80.6,80.6,80.6,80.6,80.6,80.6,0), // ANPE Extremadura: "Jefatura Departamento" (Secundaria y otros centros): 80,60€/mes
}, {
  finalTerms:(idx,anios,flags,d)=> d.productividad[idx]*2,
  // Revisado 2026-09-21 a petición del usuario ("revisa maestro de ESO comunidad por comunidad"): la
  // tabla oficial "Retribuciones del Personal Docente 2026" (Dirección General Personal Docente, Junta
  // de Extremadura) lista un par de columnas "Mensual" / "P.A.C.E." (paga adicional de carácter
  // extraordinario) para cada concepto, y ambas columnas son IGUALES en toda la tabla — incluida
  // Tutoría (49,66€/49,66€) y "Maestros en 1er ciclo E.S.O." (137,03€/137,03€) — a diferencia del
  // supuesto por defecto (×12 solamente) que se aplica al resto de comunidades sin verificar esto.
  tutoriaInExtra: true,
  adicionalESOInExtra: true,
});

// ---------- GALICIA ----------
// Converted 2026-09-20 from makeStandard() to its own calc() at the user's request: what looked like
// a "Complemento específico autonómico (CEA)" was actually two unrelated concepts wrongly folded into
// that one generic field — 158,16€ is a "Complemento de profesor de FP" (idx1, which also covers the
// 598-PESSFP alias) and 938,38€ is a "Complemento de cargo de Inspector" (idx8), neither of which is a
// real CEA. Also fixed: Tutoría is gated by the "Tutor" toggle like every other comunidad (no longer
// always-on), and Jefe de departamento no longer applies to Inspección (doesn't make sense there).
// Re-verificado 2026-09-22 (a petición del usuario, "busca outra normativa máis recente que a de 2024")
// contra a ORDE do 23 de xaneiro de 2026 (DOG núm. 16, 26-01-2026), Anexo V — "Inspectores/as de
// educación, profesorado dos centros de ensino básico, bacharelato, formación profesional, ensinanzas
// artísticas e idiomas": documento oficial de 2026, sustitúe a fonte de 2024 usada antes. Confirma
// EXACTOS: especifico (779,29/841,81/911,59€, "Compoñente xeral do complemento específico"),
// complementoCargoInspector ("Inspector/a de educación", 938,38€ — a táboa tamén ten tarifas máis
// altas para "Xefe/a provincial"=1.233,28€ e "Coordinador/a de sector"=975,96€, non modeladas, mesmo
// patrón que outras comunidades), tutoria ("Titoría e outras funcións docentes", 66,04€), xefeDepartamento
// (83,00€, listado para IES/CIFP/EOI/CEIP baixo distintos nomes de cargo) e toda a táboa de cargo
// directivo (CARGO_RAW). Sexenios corrixidos 2026-09-22: 2º tramo 115,23€→115,22€ e 3º tramo
// 153,66€→153,67€ (1 céntimo cada un, mesma suma acumulada — o cartel de ANPE Galicia "Retribucións
// 2026", ver abaixo, mostra 115,23/153,66, coincidindo co valor antigo; ante o conflito mantense o
// DOG, fonte oficial primaria, sobre o cartel sindical). adicionalESO e complementoProfesorFP
// confirmados 2026-09-22 contra ANPE Galicia, "Retribucións 2026" (xaneiro 2026,
// documentos.anpegalicia.es/docs/25_26/retribucions_ga_26.pdf) — o Anexo V do DOG non os menciona en
// absoluto, pero este cartel sindical si: "Complemento Mestres ESO" = 118,25€ e "Complemento PTFP" =
// 158,16€, ambos coincidentes exactos cos xa usados polo motor.
COMUNIDADES['Galicia'] = {
  salaryData: {
    destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
    especifico: arr9(779.29,779.29,779.29,779.29,779.29,779.29,779.29,841.81,911.59),
    // Complemento específico singular (antes "Complemento de cargo de Inspector"): 938,38€.
    complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,938.38),
    sexenio: {sin:0, s1:89.63, s2:115.22, s3:153.67, s4:217.64, s5:64},
    tutoria: arr9(66.04,66.04,66.04,66.04,66.04,66.04,66.04,66.04,0),
    adicionalESO: onlyF(118.25),
    complementoProfesorFP: arr9(0,158.16,0,0,0,0,0,0,0),
    // ANPE Galicia, "Xefatura de departamento, Coordinacións, ENDL": 83€/mes — no aplica a Inspección.
    jefeDepartamento: arr9(83,83,83,83,83,83,83,83,0),
  },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const tutorTerm = si(flags.tutor) ? d.tutoria[idx]*12 : 0;
    const adic = si(flags.maestroESO) ? d.adicionalESO[idx] : 0;
    const jefeDept = (d.jefeDepartamento[idx] && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx]*14 : 0;
    const carreraMejora = (d.complementoMejora && si(flags.carreraGeneral)) ? d.complementoMejora[idx]*12 : 0;
    // Exception (2026-09-20, at the user's request): this complement is for 591-PTFP only — 598
    // shares 591's data slot (idx1) everywhere else in the engine, but NOT for this one concept.
    const profesorFP = flags.is598 ? 0 : d.complementoProfesorFP[idx];
    const cargoInspector = d.complementoCargoInspector[idx];
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+profesorFP+cargoInspector)*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + (d.especifico[idx]+profesorFP+cargoInspector)*2
      + cargoAmt*14
      + d.extraTrienio[idx]*b*2
      + adic*12
      // Adicional Maestro ESO EN LA EXTRA (2026-09-21, revisado a petición del usuario, "comunidad por
      // comunidad"): a diferencia de la mayoría, en Galicia esto SÍ se paga en la extra — fuentes
      // sindicales (CIG-Ensino) confirman explícitamente que el "Complemento Retributivo Nivelador" se
      // paga "en catorce mensualidades iguais: as doce ordinarias máis as dúas pagas extraordinarias".
      + adic*2
      + sexAnual*12
      + tutorTerm
      + sexAnual*2
      + jefeDept
      + carreraMejora;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      if (profesorFP !== 0) items.push({label:'Complemento de profesor de FP', monthly: profesorFP});
      if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: adic});
      items.push({label:'Sexenios', monthly: sexAnual});
      if (d.tutoria[idx] !== 0) items.push({label:'Tutoría', monthly: si(flags.tutor) ? d.tutoria[idx] : 0});
      if (d.complementoMejora && d.complementoMejora[idx] !== 0) items.push({label:'Complemento de mejora', monthly: si(flags.carreraGeneral) ? d.complementoMejora[idx] : 0});
      if (d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación',
        monthly: si(flags.jefeDepartamento) ? d.jefeDepartamento[idx] : 0});
    }
    return base;
  },
  // Tutoría y Complemento de mejora son ×12-only en la fórmula anual de arriba (sin término ×2) — no
  // se cobran en la paga extra. Adicional Maestro ESO SÍ (ver nota en calc() arriba, fuente CIG-Ensino).
  pagaExtraItems(idx, anios, flags, d){
    const b = trunc(anios/3);
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const profesorFP = flags.is598 ? 0 : d.complementoProfesorFP[idx];
    const cargoInspector = d.complementoCargoInspector[idx];
    const jefeDept = (d.jefeDepartamento[idx] && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
    ];
    if (profesorFP !== 0) items.push({label:'Complemento de profesor de FP', monthly: profesorFP});
    if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
    items.push({label:'Sexenios', monthly: sexAnual});
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    if (si(flags.maestroESO) && d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: d.adicionalESO[idx]});
    return items;
  }
};

// ---------- MADRID ----------
// Corrected 2026-09-21 against the official BOCM (Orden de 3 de febrero de 2026, BOCM núm. 33,
// 09-02-2026, Anexo II "Retribuciones complementarias de los funcionarios de cuerpos docentes no
// universitarios"): destino/específico general (incl. Inspección 892,77€ y Catedráticos 858,87€) y
// los 5 tramos de sexenios ya coincidían exactos. El 1.238,73€ de Inspección estaba mal etiquetado
// como "específico autonómico" — corregido 2026-09-21: el documento lo lista bajo "Componente
// singular del complemento específico... puestos de trabajo docentes singulares → Función
// Inspectora" ("Inspectores de Educación", distinto de Jefe/Coordinador de Inspección, que cobran
// más), el mismo patrón que Aragón/Baleares/Cantabria/Cataluña/etc., así que ahora es
// complementoCargoInspector, no especificoAutonomico (Madrid no tiene CEA real).
// Corregidos otros dos errores reales: (1) especifico[idx2] (596-Maestros de Taller de Artes Plásticas y
// Diseño) tenía el importe de Maestros (781,84€) en vez de 798,41€ — el documento agrupa
// explícitamente 591-PTFP/598-Especialistas FP/596-Maestros de Taller en un único importe de
// 798,41€ (A2, nivel 24), no el de 597-Maestros (A2, nivel 21); (2) tutoría de ese mismo grupo
// (idx1/idx2) estaba en 44,15€ (tramo "Infantil/Primaria/Adultos/Especial") en vez de 70,94€ (tramo
// "Secundaria/Bachillerato/FP"), que es el que corresponde a un grupo que trabaja en FP/Artes
// Plásticas de nivel secundario. Jefatura de Departamento (2026-09-21, a petición del usuario): el
// documento la gradúa por nº de miembros del departamento (1-2: 80,30€ · 3-6: 100,09€ · 7-10:
// 143,86€ · +10: 187,65€), pero el motor solo admite un valor fijo por comunidad — el usuario eligió
// usar el tramo intermedio (3-6 miembros, 100,09€) como aproximación representativa en vez de añadir
// un selector nuevo de tamaño de departamento.
// Re-verificado 2026-09-21 contra ANPE Madrid, "Retribuciones 2026" (febrero 2026): confirma exacto
// todo lo anterior. Cargo directivo (ver CARGO_RAW) modelado con el módulo fijo del documento.
COMUNIDADES['Madrid'] = makeStandard({
  destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
  especifico: arr9(781.84,798.41,798.41,798.41,798.41,798.41,798.41,858.87,892.77),
  complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,1238.73),
  sexenio: {sin:0, s1:93.28, s2:117.70, s3:156.82, s4:214.64, s5:63.20},
  tutoria: arr9(44.15,70.94,70.94,70.94,70.94,70.94,70.94,70.94,0),
  adicionalESO: onlyF(133.97),
  complementoMejora: fill(0), productividad: fill(0),
  jefeDepartamento: fill(100.09), // aproximación al tramo "3-6 miembros" del documento, ver nota arriba
}, {
  finalTerms:(idx,anios,flags,d)=> d.productividad[idx]*2,
  // Alumnado asumido por tipo de centro (2026-09-21, a petición del usuario) — editable en Datos CCAA
  // ("Reglas / parámetros especiales"), alimenta recalcMadridCargoDirectivo() más abajo, que deriva
  // la tabla de cargo directivo real (módulo fijo + 0,63€/alumno) de estos valores en vez de tenerla
  // hardcodeada por separado.
  rules: { alumnos: {
    A2: { A:700, B:500, C:500, D:500, E:250, F:250 },
    A1: { A:1000, B:700, C:700, D:700, E:400, F:400 },
  } },
  // adicionalESOInExtra (2026-09-21, a petición del usuario, "revisa comunidad por comunidad"):
  // fuentes confirman que la paga extraordinaria en Madrid incluye "Sueldo base + Trienios +
  // Complemento de destino + Complemento específico" sin reducir, y que el complemento compensatorio
  // de Maestros en 1º/2º de ESO es, igual que en el resto de comunidades, una diferencia del propio
  // complemento de destino — así que se cobra también en la extra.
  adicionalESOInExtra: true,
});
// Deriva la tabla de cargo directivo de Madrid (CARGO_TABLE) a partir de rules.alumnos: Director =
// 653,57€ (módulo fijo) + 0,63€ × alumnos; Vicedirección/Jefatura de Estudios/Secretaría = 54% (CEIP)
// o 60% (IES) de ese importe completo, por ANPE Madrid "Retribuciones 2026"; Jefatura de Estudios
// Adjunta es fija (385,49€), no depende de alumnos. Se llama una vez al cargar (para que CARGO_TABLE
// arranque en sync con rules.alumnos) y de nuevo cada vez que el usuario edita un valor de alumnos.
function recalcMadridCargoDirectivo(){
  const alumnos = COMUNIDADES['Madrid'].rules.alumnos;
  const pct = { A2: 0.54, A1: 0.60 };
  ['A2','A1'].forEach(grp => {
    TIPOS.forEach(tipo => {
      const n = alumnos[grp][tipo] || 0;
      const director = Math.round((653.57 + 0.63*n) * 100) / 100;
      const vjs = Math.round(director * pct[grp] * 100) / 100;
      setCargoTable('Madrid', grp, tipo, 'Dirección', director);
      setCargoTable('Madrid', grp, tipo, 'Vicedirección', vjs);
      setCargoTable('Madrid', grp, tipo, 'Jefatura de Estudios', vjs);
      setCargoTable('Madrid', grp, tipo, 'Secretaría', vjs);
      setCargoTable('Madrid', grp, tipo, 'Jefatura de Estudios Adjunta', 385.49);
    });
  });
}
recalcMadridCargoDirectivo();

// ---------- VALENCIA ----------
// Corrected 2026-09-21 contra el DOGV oficial (Acuerdo de 27-02-2026, del Consell, DOGV núm. 10312,
// "Taula 2 — Retribucions del personal docent"), a petición del usuario ("revisa Valencia, busca
// documentos oficiales"): específico y sexenios eran de una tabla desactualizada, previamente
// señalada como sospechosa en las Observaciones ("posible tabla desactualizada") pero nunca
// verificada — confirmado que la tabla anterior era, en efecto, anterior a la subida del RD-ley
// 14/2025 de 2026 (todos los valores ~11-24€ por debajo de los reales, consistente en toda la
// tabla). Específico base por nivel: A2-21 (Maestros) 737,37€ · A2-24 (PTFP/Maestros TAPD) 738,99€ ·
// A1-24 (Secundaria/EOI/Música/Artes Plásticas) 741,97€ · A1-26 (Catedráticos) 807,18€ · Inspección
// (tabla propia "INSPECTORS/RES A1-28") 1.610,37€.
COMUNIDADES['Valencia'] = makeStandard({
  destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
  especifico: arr9(737.37,738.99,738.99,741.97,741.97,741.97,741.97,807.18,1610.37),
  // Complemento específico singular (2026-09-21, corregido a petición del usuario): el nivel 28
  // (1.041,22€ de destino) del DOGV es solo para "Inspector/a Cap Territorial", no para Inspección en
  // general — no toca `destino` (queda compartido en nivel 26, igual que el resto de la app). Lo que
  // sí aplica a toda Inspección es su propio "ESPECÍFIC BASE" de la tabla separada "INSPECTORS/RES
  // A1-28" del DOGV: 1.610,37€ (ya en `especifico` arriba) MÁS este componente singular —
  // "INSPECTOR/A GRAL. EDUCACIÓ" — de 682,09€, mismo patrón que Aragón/Baleares/Cantabria/Cataluña/
  // Galicia/La Rioja/Madrid.
  complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,682.09),
  // Sexenios corregidos igual que el específico — tabla "SEXENNIS PERSONAL DOCENT" del mismo DOGV,
  // columna MENSUAL (el incremento propio de cada tramo, no el acumulado): 1r 128,37€ · 2n 135,98€ ·
  // 3r 155,54€ · 4t 169,30€ · 5è 98,42€.
  sexenio: {sin:0, s1:128.37, s2:135.98, s3:155.54, s4:169.30, s5:98.42},
  tutoria: fill(0),
  // "Adicional Maestro ESO" (2026-09-21, revisado a petición del usuario): el DOGV núm. 10312 no lo
  // itemiza como línea propia — no cubre normativa de destino por puesto, solo las tablas retributivas
  // planas. Se mantiene como destino[Secundaria]-destino[Maestros] = 137,03€ porque ese valor exacto
  // ya está confirmado, DOCUMENTADO Y CON NOMBRE OFICIAL en Extremadura (mismo importe): "Complemento
  // Retributivo Nivelador" — el mecanismo nacional que sube el complemento de destino de un/a Maestro/a
  // que imparte 1r/2n ciclo de ESO al nivel de Secundaria (729,14€, nivel 24) en vez de su nivel propio
  // (592,11€, nivel 21). Como Valencia usa el destino genérico del Ministerio sin "valor propio", este
  // mismo mecanismo nacional debería aplicarle igual — no es una coincidencia derivada, es el mismo
  // complemento que Andalucía/Cataluña/Extremadura tienen documentado con idéntico importe (137,03€).
  // Independently reconfirmed 2026-09-21 against ANPE Comunitat Valenciana's own "Calcula tu nómina"
  // card: its "Maestros ESO" row (destino 729,14€) totals exactly 137,03€ more than its "Maestros" row
  // (2.666,03€ vs 2.529,00€) — the same figure, from a third angle. Written as the literal 137.03
  // (not `729.14-592.11`, which is 137.02999999999997 in floating point and was leaking that many
  // decimals into the "Datos particulares" input field) — a petición del usuario.
  adicionalESO: onlyF(137.03),
  // Complemento específico autonómico y Complemento de mejora/carrera profesional eliminados
  // 2026-09-21 (a petición del usuario): el DOGV no recoge ninguno de los dos para el personal
  // docente valenciano — no son "0€ sin verificar", son conceptos que Valencia no tiene.
  productividad: fill(0),
  jefeDepartamento: fill(84.76), // ANPE Comunitat Valenciana, "Jefatura de Departamento": 84,76€/mes
}, {
  finalTerms:(idx,anios,flags,d)=> d.productividad[idx]*2,
  // adicionalESOInExtra (2026-09-21, a petición del usuario, "revisa comunidad por comunidad"): la
  // ficha de ANPE C. Valenciana modela esto como una reasignación real del propio Complemento de
  // destino (fila "Maestros ESO" con destino=729,14€, no una línea aparte), y su propia fórmula de
  // paga extra ("Sueldo base + Complemento de destino + Complemento específico + Trienios") no reduce
  // el destino — así que la subida se cobra igual en la extra. No confundir con Tutoría (Valencia no
  // la tiene, tutoria:fill(0)) ni con La Rioja, cuya propia fuente confirma "12 mensualidades" para
  // este mismo concepto — es una comprobación por comunidad, no una regla universal.
  adicionalESOInExtra: true,
});

// ---------- PAÍS VASCO ----------
// Corregido 2026-09-21 (a petición del usuario) contra la "Instrucción sobre retribuciones del personal
// docente" (24-02-2026, Gobierno Vasco). Todos los conceptos del documento son "(14)" — 12 mensualidades
// + 2 pagas semestrales — salvo la Diferencia Básica (12). Los importes anteriores procedían del Excel
// original ("SIN ACTUALIZAR") y estaban desfasados.
//  · Complemento de destino: 701,21€ nivel 21 (Maestros/as), 880,09€ nivel 24 (resto de A2 y Secundaria/
//    EOI/Música/Artes Plásticas), 1.083,17€ nivel 26 (Catedráticos e Inspección).
//  · Complemento específico en 3 capas: (a) específico general → `especifico`; (b) capitalización de
//    sexenios → `sexenio` (ver abajo); (c) complejidad docente (2% de los conceptos salariales de 2025,
//    Decreto 252/2025 art. 67) → se modela en `especificoAutonomico` (mismo cálculo 14 pagas, se ve
//    como línea aparte "Complemento específico autonómico"). Filas por cuerpo del documento:
//    Maestros 50,42 / Maestros ESO 53,94 / FP (PES-FP, PTFP) 58,44 / Secundaria-EOI-Música-Artes 58,89 /
//    Catedráticos 66,27 / Inspección 79,83.
//  · Trienios: el documento los abona como Antigüedad (43,54 A2 / 53,39 A1) + "Diferencia Básica" (9,19 A2 /
//    10,48 A1, solo 12 pagas). Se suman en un único importe mensual (override de `trienios`) para
//    no tocar la fórmula compartida; la paga extra del trienio (31,74 / 32,96) es la genérica.
//  · Sexenios: el 1º, 4º y 5º se cobran por antigüedad (96,81 / 57,75 / 47,86€) en la escalera normal
//    (`sexenio`, s2=s3=0 porque no existen como sexenios "por años"). El 2º y 3º ("capitalización") se
//    pagan de golpe desde el primer día: 316,77€/mes en total para ambos (una sola fila "2º y 3º" en
//    el documento, código 2108, 4.434,78€ = 316,77×14) — importe CONJUNTO, confirmado por el usuario
//    2026-09-22 (no es por sexenio). Modelado 2026-09-22 (a petición del usuario, "ponlo en la tabla
//    de sexenios, sin sexenio, como en las otras") como `sexenio.sin` — igual que Asturias/Cantabria —
//    en vez de un campo aparte (`sexenioCapitalizacion`): la diferencia es que aquí ese "sin sexenio"
//    debe seguir pagándose SIEMPRE, incluso una vez alcanzado el 1º/4º/5º tramo (no es un valor "hasta
//    el primer sexenio", es una capitalización independiente de los años) — de ahí el flag
//    `sexenioSinPersists: true` más abajo, que hace que `sexenioStandard` sume `sin` como suelo fijo en
//    vez de sustituirlo por la escalera (ver la función).
//  · Tutoría: el Anexo I solo la recoge para Maestro/a EG01 (71,35€, 14 pagas) → resto de cuerpos 0€.
//  · Jefe de departamento: Coordinador/a de ciclo 64,84€ (Maestros), jefe seminario/dpto. 64,29€ (FP) y
//    93,15€ (ESO; también aplicado a Catedráticos). Inspección no tiene equivalente → 0€.
//  · Adicional Maestro ESO: no es una línea aparte en el documento, es que "Maestros/as ESO" pasan a
//    nivel 24 (880,09 vs 701,21 = 178,88€) y su complejidad docente sube de 50,42 a 53,94€ (3,52€) —
//    182,40€/mes en total, y como ambos son (14) se cobra también en la paga extra (adicionalESOInExtra).
COMUNIDADES['País Vasco'] = makeStandard({
  destino: arr9(701.21,880.09,880.09,880.09,880.09,880.09,880.09,1083.17,1083.17),
  especifico: arr9(704.28,932.57,932.57,797.33,797.33,797.33,797.33,968.51,1656.79),
  especificoAutonomico: arr9(50.42,58.44,58.44,58.89,58.89,58.89,58.89,66.27,79.83),
  sexenio: {sin:316.77, s1:96.81, s2:0, s3:0, s4:57.75, s5:47.86}, // sin = capitalización 2º y 3º (ver nota arriba)
  tutoria: onlyF(71.35),
  adicionalESO: onlyF(182.4),
  complementoMejora: fill(0), productividad: fill(0),
  jefeDepartamento: arr9(64.84,64.29,64.29,93.15,93.15,93.15,93.15,93.15,0),
}, { overrides: {
    destino: arr9(701.21,880.09,880.09,880.09,880.09,880.09,880.09,1083.17,1083.17),
    trienios: arr9(52.73,52.73,52.73,63.87,63.87,63.87,63.87,63.87,63.87), // Antigüedad + Diferencia Básica
  },
  finalTerms:(idx,anios,flags,d)=> d.productividad[idx]*2,
  tutoriaInExtra: true, adicionalESOInExtra: true, sexenioSinPersists: true });

// ---------- LA RIOJA ----------
COMUNIDADES['La Rioja'] = {
  // Corrected 2026-09-19, then reverted the same day at the user's explicit instruction: an earlier
  // pass here set overrides.extraTrienio to [31.74×3, 32.86×6], based on a reading of "Nómina La
  // Rioja (Enero 2026).xlsx" that turned out to be a misdiagnosis — La Rioja's extra trienio is in
  // fact identical to the national Ministry generic (32.96€ for idx3-8), confirmed by the user. No
  // override: this field now simply inherits GENERIC_DATA.extraTrienio like the majority of comunidades.
  overrides: {},
  salaryData: {
    destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
    // Corrected 2026-09-19: the original comparativa.xlsx had a real data-entry error here for idx1-6.
    // Verified against the separate individual-payslip file "Nómina La Rioja (Enero 2026).xlsx",
    // sheet Rioja_Sueldo, row 4 ("Complemento Específico General"): B4=815.42 (Maestros, idx0),
    // C4=820.67 (Prof.Sing.FP, idx1-2), D4=837.85 (Secundaria/EOI/Música/ArtesPlasticas, idx3-6),
    // E4=909.64 (Catedráticos, idx7, unchanged). idx8 (Inspección) has no category in that payslip
    // file, so it is intentionally left as-is (1587.19) rather than guessed.
    // Re-checked 2026-09-22 against the official "Tabla de retribuciones 2026" (larioja.org, the one
    // concrete document the user confirmed is the only one that exists): it lists 825.47€ for
    // Secundaria/EOI/Música/ArtesPlásticas (idx3-6), not 837.85€ — but the user confirmed 837.85€ is
    // correct against their own real nómina, i.e. the OFFICIAL DOCUMENT has an error here, not the app.
    // Left at 837.85€ deliberately; do not "fix" this to 825.47€ without new evidence.
    especifico: arr9(815.42,820.67,820.67,837.85,837.85,837.85,837.85,909.64,946.83),
    // Complemento de cargo de Inspector (2026-09-20, a petición del usuario): 666,22€, aparte del
    // específico general de Inspección — mismo patrón que Baleares/Extremadura/Galicia.
    complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,666.22),
    sexenio: {sin:0, s1:74.30, s2:93.73, s3:124.96, s4:171.00, s5:50.32},
    // Corrected 2026-09-22 a petición del usuario: la "Tabla de retribuciones 2026" oficial trae
    // 159,91€ para "Maestro ESO (CPT) (12 mensualidades)" — antes 153,71€ (fuente ANPE, desactualizada).
    adicionalESO: onlyF(159.91),
    jefeDepartamento: fill(87.93), // ANPE La Rioja, "Jefe de Departamento": 87,93€/mes
    // "Carrera profesional" (Grado I / Grado II): importe mensual, distinto según el cuerpo sea A2
    // (597/591/596) o A1 (resto) — como en Asturias, gestionado por el interruptor "Carrera
    // profesional" y por años de antigüedad (Grado I ≥5 años, Grado II ≥11 años). Pagado en las 14
    // pagas (no solo 12), a diferencia de Asturias.
    carreraGradoI: arr9(80.52,80.52,80.52,104.73,104.73,104.73,104.73,104.73,104.73),
    carreraGradoII: arr9(109,109,109,141,141,141,141,141,141),
  },
  rules: { carreraUmbral1: 5, carreraUmbral2: 11 },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const carrera = !si(flags.carreraGeneral) ? 0
      : anios > rules.carreraUmbral2 ? d.carreraGradoII[idx]
      : anios > rules.carreraUmbral1 ? d.carreraGradoI[idx] : 0;
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const cargoInspector = d.complementoCargoInspector[idx];
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+cargoInspector)*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + (d.especifico[idx]+cargoInspector)*2
      + cargoAmt*14
      + jefeDept*14
      + d.extraTrienio[idx]*b*2
      // Corrected 2026-09-19 at the user's request: La Rioja's own formula gated adicionalESO on
      // $C$4="s" (never equals the real "SI"/"NO" selector value) — dead code, now live.
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      + sexAnual*12
      + 0 // Tutoría row is 0 in this community's data (and its own C7 gate is also dead: "s")
      + sexAnual*2
      + carrera*14;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      items.push({label:'Sexenios', monthly: sexAnual});
      if (d.carreraGradoI[idx] !== 0 || d.carreraGradoII[idx] !== 0) items.push({label:'Carrera profesional (Grado I/II)', monthly: carrera});
    }
    return base;
  },
  // Corrected 2026-09-19: verified directly against "Nómina La Rioja (Enero 2026).xlsx" — its own
  // paga-extra formula (Nómina!F29) literally ends in "...+F13" (F13 = Complemento de grado), i.e.
  // the real payslip DOES repeat "Carrera profesional / evaluación docente" in the June/December
  // extra payment, unlike most other comunidades — so it's included here too. Only Adicional Maestro
  // ESO is ×12-only in the annual formula above and excluded from the extra.
  pagaExtraItems(idx, anios, flags, d, rules){
    const b = trunc(anios/3);
    const carrera = !si(flags.carreraGeneral) ? 0
      : anios > rules.carreraUmbral2 ? d.carreraGradoII[idx]
      : anios > rules.carreraUmbral1 ? d.carreraGradoI[idx] : 0;
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const cargoInspector = d.complementoCargoInspector[idx];
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
    ];
    if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    items.push({label:'Sexenios', monthly: sexAnual});
    if (d.carreraGradoI[idx] !== 0 || d.carreraGradoII[idx] !== 0) items.push({label:'Carrera profesional (Grado I/II)', monthly: carrera});
    return items;
  }
};

// ---------- MURCIA ----------
// Corrected 2026-09-21 against two sources: ANPE Murcia "Tus Retribuciones" (actualización enero
// 2026, documentos.anpemurcia.es) and CCOO Región de Murcia "Retribuciones enseñanza" (actualización
// enero 2026, murcia.fe.ccoo.es): sueldo/destino/específico general/productividad fija/sexenios/
// carrera profesional for idx0-7 (Maestros through Catedráticos) all already matched exactly.
// Inspección (idx8) had two real errors: the specific-complement figure only had the "Componente
// General" (463,70€), missing its own "Complemento Específico Singular" (989,90€, CCOO) — the same
// concept every other cuerpo also gets, just at 64,21€ instead. productividadFijaMensual was
// 1.577,58€ (source unknown, unverified), corrected to the real 394,50€. Paga extra's shiftProdFija
// similarly corrected from 1.716,67€ to the real 621,89€ (CCOO, "Productividad semestral: Factor C.
// Específico"). Jefatura de Departamento ("Jefatura Seminario/Jefatura Departamento", CCOO): 147,50€,
// previously 0€/sin dato.
// Split 2026-09-21 (a petición del usuario): "General" y "Específico Singular" eran un solo campo
// combinado (generalEspSingular); ahora son dos campos/líneas separadas — especificoGeneral (369,21€
// para todos salvo Catedráticos 428,60€ e Inspección 463,70€) y especificoSingular (64,21€ "acción
// tutorial" para todos salvo Inspección, que tiene su propio "Complemento Específico Singular" de
// Inspector: 989,90€, muy superior al genérico). La fórmula (base y paga extra) sigue sumando ambos,
// así que el total no cambia — solo se ve el desglose.
// Re-verificado 2026-09-21 contra una TERCERA fuente, esta vez oficial y primaria: BORM núm. 291
// (18-12-2025), Acuerdo de Consejo de Gobierno de 11-12-2025, ANEXO XI "Personal de cuerpos
// docentes" (cifras base 2025, +2,5%; aplicando el +1,5% adicional de 2026 del RD-ley 14/2025 se
// obtienen exactas las cifras ya usadas arriba — confirma especificoGeneral, especificoSingular
// [salvo Inspección, que no aparece desglosado como "singular" ahí sino como su propio "Componente
// del complemento específico" en la función inspectora, mismo valor 463,70/989,90 vía otra vía],
// productividadFijaMensual, shiftDestino, shiftProdFija y carreraProfesional, cifra a cifra). El
// mismo ANEXO trae también la tabla completa de "Paga adicional del complemento específico"
// (graduada por nº de sexenios 0-5), que faltaba por completo — ver pagaAdicionalEspecifico y
// pagaExtraOverride más abajo. El resto del BORM (fuera del ANEXO XI) es la subida genérica de
// "Administración General" (grupos A1/A2/C1/C2/E, no cuerpos docentes) — no aporta nada docente-
// específico salvo confirmar la escala genérica de complemento de destino por nivel.
COMUNIDADES['Murcia'] = {
  overrides: {},
  salaryData: {
    destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
    especificoGeneral: arr9(369.21,369.21,369.21,369.21,369.21,369.21,369.21,428.60,463.70),
    especificoSingular: arr9(64.21,64.21,64.21,64.21,64.21,64.21,64.21,64.21,989.90),
    productividadFijaMensual: arr9(437.91,444.36,444.36,444.36,444.36,444.36,444.36,447.68,394.50),
    sexenio: {sin:0, s1:70.45, s2:88.89, s3:118.44, s4:162.07, s5:47.38},
    carreraProfesional: arr9(90.26,90.26,90.26,160.6,160.6,160.6,160.6,160.6,160.6),
    adicionalESO: onlyF(139.1),
    // "Productividad semestral" helper tables (paid twice a year, in the paga extra), per cuerpo idx
    // — official CARM names: "factor complemento de destino" and "factor complemento específico":
    shiftDestino: arr9(240.24,295.87,295.87,295.87,295.87,295.87,295.87,354.36,354.36),
    shiftProdFija: arr9(524.07,524.07,524.07,524.07,524.07,524.07,524.07,586.77,621.89),
    jefeDepartamento: fill(147.50),
    // "Paga adicional del complemento específico" (2026-09-21, previously undocumented/unmodeled):
    // official CARM figures, graduated by nº de sexenios (0-5), ANEXO XI.4º of the Acuerdo de
    // Consejo de Gobierno de 11-12-2025 (BORM núm. 291, 18-12-2025), ×1.015 for the 2026 RD-ley
    // 14/2025 raise. Three tiers-tables: "general" for idx0-6 (Maestros/PTFP/Secundaria — all
    // identical in the source), "catedraticos" for idx7, "inspeccion" for idx8.
    pagaAdicionalEspecifico: {
      general:      [260.96, 306.00, 362.87, 438.60, 542.28, 572.85],
      catedraticos: [298.98, 344.04, 400.88, 476.64, 580.35, 610.85],
      inspeccion:   [321.44, 366.55, 423.38, 499.14, 602.81, 633.33],
    },
  },
  // carreraMinAnios: umbral real de años de servicio para el Tramo I de la Carrera Profesional
  // (único tramo que existe en la práctica — ver nota junto a carreraProf más abajo). Editable en
  // "Reglas / parámetros especiales", por si la Administración lo cambia.
  rules: { carreraMinAnios: 6 },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const s = d.sexenio;
    const sexNormal = sexenioStandard(anios, s);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    // Carrera profesional (2026-09-19, umbral real añadido 2026-09-21): gated by the "Carrera
    // profesional" toggle AND a real eligibility threshold — confirmed (STERM/intersindicalrm.org,
    // resoluciones de encuadramiento CARM) that Tramo I requires "1 sexenio completo" (6 años de
    // servicio); tramos superiores exigirían una "evaluación de desempeño" nunca definida por la
    // Administración, así que en la práctica solo existe Tramo I. Before this, the toggle alone
    // controlled payment with no años check, so it could show Tramo I as payable for someone with 0
    // años de servicio, which isn't real. Murcia already has a real per-cuerpo figure for this
    // (d.carreraProfesional, Tramo I), so the toggle now just lets the user opt out even once
    // eligible, not fake an eligibility that doesn't exist yet.
    const carreraProf = (si(flags.carreraGeneral) && anios >= rules.carreraMinAnios) ? d.carreraProfesional[idx] : 0;
    const nSex = Math.min(trunc(anios/6), 5);
    const pagaAdicTable = idx === 8 ? d.pagaAdicionalEspecifico.inspeccion
      : idx === 7 ? d.pagaAdicionalEspecifico.catedraticos
      : d.pagaAdicionalEspecifico.general;
    // Corrected 2026-09-21 against the official BORM (see note above the community definition): the
    // paga extra (junio/diciembre) does NOT pay the monthly específico/productividad at any
    // percentage — it pays its OWN distinct concepts instead, all confirmed exact against the
    // official "TOTAL PAGA SEMESTRAL" figures: destino (full), "Productividad semestral" (factor
    // destino + factor específico — shiftDestino/shiftProdFija, ×2 for the two payments) and "Paga
    // adicional del complemento específico" (pagaAdicTable[nSex], also ×2). This replaces the old
    // (especificoGeneral+especificoSingular)×70% + productividadFijaMensual×60% + sexenioExtra-ladder
    // terms, which were never actually verified against an official source and turned out wrong —
    // removing them changed the ANNUAL total, not just the payslip display.
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especificoGeneral[idx]+d.especificoSingular[idx]+d.productividadFijaMensual[idx])*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + cargoAmt*14
      + jefeDept*14
      + d.extraTrienio[idx]*b*2
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)   // Murcia's own gate uses "si" (real)
      + sexNormal*12
      + (si(flags.tutor) ? 0 : 0) // Tutoría row is 0 in this community's data
      + carreraProf*12
      + d.shiftDestino[idx]*2
      + d.shiftProdFija[idx]*2
      + pagaAdicTable[nSex]*2;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especificoGeneral[idx]});
      items.push({label:'Complemento específico singular', monthly: d.especificoSingular[idx]});
      items.push({label:'Productividad fija mensual', monthly: d.productividadFijaMensual[idx]});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      items.push({label:'Sexenios', monthly: sexNormal});
      // Source label is "Carrera profesional (a partir de 6 años antigüedad)". Gated by the "Carrera
      // profesional" toggle (off by default) AND the real años>=rules.carreraMinAnios threshold (see
      // carreraProf above) — shown normally now (2026-09-21, a petición del usuario), unlike the
      // original ground_truth_fixture, which never itemized it on any tested "Nómina mensual" row
      // (all with the toggle off, so it correctly never appeared there either).
      if (d.carreraProfesional[idx] !== 0) items.push({label:'Carrera profesional (Tramo I)', monthly: carreraProf});
    }
    return base;
  },
  // "Nómina mensual" paga-extra block for Murcia — rewritten 2026-09-21 against the official BORM
  // (Acuerdo de Consejo de Gobierno de 11-12-2025, BORM núm. 291), replacing a version that had been
  // "confirmed verbatim against the [Excel] source dump" but never against an official document. At
  // the user's request to check the real document instead of the Excel: summing ONLY the official
  // building blocks below (no percentage reductions of any kind) reproduces the union-published
  // "TOTAL PAGA SEMESTRAL (sin antigüedad)" EXACTLY for all 5 cuerpo groups, Inspección included
  // (2.492,21 / 2.684,87 / 2.666,09 / 2.969,54 / 3.027,12€) — confirming the paga extra does NOT pay
  // the monthly específico or productividad fija at any percentage. It pays instead: sueldo/trienio
  // at their own reduced rate, destino at full rate, "Productividad semestral" (shiftDestino +
  // shiftProdFija — the CARM's own "factor de complemento de destino"/"factor complemento
  // específico" tables, uniform for every cuerpo including Inspección) and "Paga adicional del
  // complemento específico" (pagaAdicionalEspecifico above), graduated by nº de sexenios (0-5).
  pagaExtraOverride(idx, anios, flags, d){
    const b = trunc(anios/3);
    const nSex = Math.min(trunc(anios/6), 5);
    const pagaAdicTable = idx === 8 ? d.pagaAdicionalEspecifico.inspeccion
      : idx === 7 ? d.pagaAdicionalEspecifico.catedraticos
      : d.pagaAdicionalEspecifico.general;
    // Jefe de departamento (2026-09-21, corregido): la fórmula anual lo paga ×14 (jefeDept*14, arriba
    // en calc()) igual que el resto de comunidades, pero se había quedado fuera de este override — sin
    // "Ajuste" que lo compensara (este override sustituye el total entero, no pasa por esa mecánica),
    // el bruto de junio/diciembre se quedaba corto en su importe cuando el interruptor estaba activo.
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    return d.extraSueldoBase[idx] + d.extraTrienio[idx]*b + d.destino[idx]
      + d.shiftDestino[idx] + d.shiftProdFija[idx] + pagaAdicTable[nSex] + jefeDept;
  },
  // Itemized version of pagaExtraOverride (2026-09-21, a petición del usuario), for the "Su nómina"
  // payslip display: replaces the app's generic fallback (repeat every monthly concept at its
  // ordinary rate, then patch the gap with a single "Ajuste" row) with the real named concepts the
  // paga extra actually pays — confirmed against the CARM/BORM source. Sums to EXACTLY the same total
  // as pagaExtraOverride, term for term, so no "Ajuste" row is ever needed for Murcia. Notably, the
  // ordinary month's "Complemento específico general/singular" and "Productividad fija mensual" are
  // NOT paid at their monthly rate in the extra — they're replaced here by "Complemento específico
  // (70%)", "Productividad (60%)", "Productividad semestral" and "Paga adicional del complemento
  // específico", none of which repeat the monthly figures.
  pagaExtraItems(idx, anios, flags, d){
    const b = trunc(anios/3);
    const nSex = Math.min(trunc(anios/6), 5);
    const pagaAdicTable = idx === 8 ? d.pagaAdicionalEspecifico.inspeccion
      : idx === 7 ? d.pagaAdicionalEspecifico.catedraticos
      : d.pagaAdicionalEspecifico.general;
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Productividad semestral (factor destino)', monthly: d.shiftDestino[idx]},
      {label:'Productividad semestral (factor específico)', monthly: d.shiftProdFija[idx]},
      {label:'Paga adicional del complemento específico', monthly: pagaAdicTable[nSex]},
    ];
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    return items;
  }
};

// ---------- CEUTA Y MELILLA ----------
COMUNIDADES['Ceuta y Melilla'] = {
  overrides: {},
  salaryData: {
    destino: arr9(592.11,729.14,729.14,729.14,729.14,729.14,729.14,873.38,873.38),
    // Complemento específico corregido 2026-09-21 (a petición del usuario, "coge la tabla ANPE y sigue
    // el aumento de 1,1196 para Catedráticos e Inspectores"): la tabla ANPE Melilla 2022 muestra un
    // específico real de 464,40€ para "Catedráticos e Inspectores" (frente a 417,34€ Maestros/PTFP y
    // 413,13€ Secundaria y EOI) — un grupo compartido, no dos cifras separadas. Escalado con el mismo
    // factor ×1,1196 (2022→2026) ya confirmado contra el cargo directivo de CSIF: 464,40×1,1196=519,94€,
    // aplicado a Catedráticos (idx7) e Inspección (idx8) por igual. Maestros/PTFP/Secundaria (idx0-6)
    // se dejan con la cifra de CSIF 2026, más próxima a su propio escalado (467,25€/462,54€) que la
    // cifra anterior.
    especifico: arr9(438.33,436.57,436.57,433.91,433.91,433.91,433.91,519.94,519.94),
    // Complemento específico singular (2026-09-21, a petición del usuario): el Excel original de
    // ANPE ya traía Inspección con dos cifras separadas — 507,58€ de específico general (la que
    // ahora sustituye la corrección de arriba) + 544,84€ de componente singular por el puesto de
    // Inspector — que el motor nunca había separado en dos campos (solo la suma, 1.052,42€, en un
    // único "especifico"). Actualizado con el mismo factor ×1,1196 (2022→2026): 544,84×1,1196=610,00€,
    // mismo patrón que Aragón/Baleares/Cantabria/Castilla La Mancha/Castilla y León/Cataluña/
    // Extremadura/Galicia/La Rioja/Madrid/Valencia.
    complementoCargoInspector: arr9(0,0,0,0,0,0,0,0,610.00),
    sexenio: {sin:0, s1:69.49, s2:87.67, s3:116.79, s4:159.78, s5:47.08},
    tutoria: arr9(50.09,50.09,50.09,63.23,63.23,63.23,63.23,63.23,63.23),
    trieniosResidencia: arr9(50.91,50.91,50.91,66.76,66.76,66.76,66.76,66.76,66.76),
    // Residencia — encontrada 2026-09-22 (a petición del usuario, "necesitamos encontrar documentos
    // oficiales de Ceuta y Melilla") una fuente oficial real para este concepto concreto: BOE-A-2007-
    // 12762 (Resolución de 21-06-2007, Acuerdo de Consejo de Ministros de 27-04-2007, en aplicación del
    // Real Decreto-ley 11/2006), que fija la "indemnización por residencia" ANUAL para el personal del
    // sector público estatal en Ceuta y Melilla: Grupo A (docentes A1) = 10.136,40€/año = 844,70€/mes;
    // Grupo B (docentes A2) = 7.545,36€/año = 628,78€/mes (importes de 2007, revisables "con las
    // correspondientes actualizaciones de las sucesivas Leyes de Presupuestos" — sin revisión propia
    // desde entonces, confirmado por noticias de julio 2026 sobre el nuevo acuerdo marco que excluye a
    // Ceuta y Melilla de la última subida). Los valores actuales del motor escalan EXACTAMENTE por el
    // mismo factor desde esa base 2007 en ambos grupos (1.102,57/844,70=1,30532 para A1;
    // 820,76/628,78=1,30532 para A2 — coincidencia hasta la 5ª cifra decimal, imposible por azar),
    // confirmando que derivan correctamente de esa indemnización 2007 acumulando las subidas anuales
    // generales. trieniosResidencia sigue sin una fuente tan precisa (su base es un Acuerdo de 2004
    // distinto, no verificado con el mismo detalle).
    residencia: arr9(820.76,820.76,820.76,1102.57,1102.57,1102.57,1102.57,1102.57,1102.57),
    adicionalESO: onlyF(134.43),
    productividad: fill(0),
    // Jefe de Departamento (2026-09-21, corregido a petición del usuario): antes 0€ ("no source figure
    // yet"). La única cifra que ANPE Melilla ha publicado es de 2022 (73,40€, en una tabla que no tiene
    // versión 2026 — solo pensiones). Escalada con el mismo factor ×1,1196 que reconstruye exactamente
    // los 8 importes de cargo directivo de CSIF 2026 a partir de sus equivalentes de ANPE 2022 (ver
    // CARGO_RAW arriba) — 82,18€. Es una estimación por escalado, no una cifra 2026 observada
    // directamente; sustituir en cuanto aparezca una fuente 2026 real.
    jefeDepartamento: fill(82.18),
  },
  rules: {},
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const b = trunc(anios/3);
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const cargoInspector = d.complementoCargoInspector ? d.complementoCargoInspector[idx] : 0;
    const base = (d.sueldoBase[idx]+d.destino[idx]+d.especifico[idx]+cargoInspector+d.residencia[idx])*12
      + d.trienios[idx]*b*12
      + (d.extraSueldoBase[idx]+d.destino[idx])*2
      + (d.especifico[idx]+cargoInspector+d.residencia[idx])*2
      + cargoAmt*14
      + jefeDept*14
      + d.extraTrienio[idx]*b*2
      + d.trieniosResidencia[idx]*b*12
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*12 : 0)
      // Adicional Maestro ESO EN LA EXTRA (2026-09-21, revisado a petición del usuario, "comunidad por
      // comunidad"): fuentes confirman que quien imparte 1º/2º de ESO cobra el complemento de destino
      // de nivel 24 en vez del nivel 21 propio — el mismo mecanismo que el resto de comunidades,
      // pagado también en la extra (a diferencia de Residencia, que sí queda fuera, ver
      // pagaExtraAdjust arriba).
      + (si(flags.maestroESO) ? d.adicionalESO[idx]*2 : 0)
      + sexAnual*12
      + (si(flags.tutor) ? d.tutoria[idx]*12 : 0)
      + sexAnual*2
      + d.productividad[idx]*2;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      if (b>0) items.push({label:'Trienios', monthly: d.trienios[idx]*b});
      items.push({label:'Complemento de destino', monthly: d.destino[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
      items.push({label:'Residencia', monthly: d.residencia[idx]});
      items.push({label:'Trienios de residencia', monthly: d.trieniosResidencia[idx]*b});
      items.push({label:'Cargo directivo', monthly: cargoAmt});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: si(flags.maestroESO) ? d.adicionalESO[idx] : 0});
      items.push({label:'Sexenios', monthly: sexAnual});
      if (d.tutoria[idx] !== 0) items.push({label:'Tutoría', monthly: si(flags.tutor) ? d.tutoria[idx] : 0});
    }
    return base;
  },
  // Source quirk (Nómina mensual!rows 34-39): the "Paga extra, ..." block has NO row mirroring
  // Residencia (row30) at all — unlike Complemento Específico, which DOES get its own paga-extra
  // row. Residencia genuinely contributes to the annual formula's ×2 term (validated as-is), but
  // that contribution never surfaces in either the ordinary or paga-extra monthly display, so it
  // must be excluded from the derived pagaExtraTotal.
  pagaExtraAdjust(idx, anios, flags, d, rules){ return d.residencia[idx]; },
  // Itemized version of the real paga extra (2026-09-21, a petición del usuario): "Residencia" y
  // "Trienios de residencia" no se cobran en la extra (confirmado numéricamente: sin ellas, la suma
  // de los conceptos reales coincide exacta con pagaExtraTotal; con ellas, el mecanismo genérico de
  // la app exigía un "Ajuste" de -1.770,17€ = -(residencia+trieniosResidencia) para cancelar el
  // sobrante). Tampoco Adicional Maestro ESO/Tutoría/Complemento de mejora, ninguno con término ×2.
  pagaExtraItems(idx, anios, flags, d){
    const b = trunc(anios/3);
    const sexAnual = sexenioStandard(anios, d.sexenio);
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const cargoInspector = d.complementoCargoInspector ? d.complementoCargoInspector[idx] : 0;
    const items = [
      {label:'Sueldo base', monthly: d.extraSueldoBase[idx]},
      {label:'Trienios', monthly: d.extraTrienio[idx]*b},
      {label:'Complemento de destino', monthly: d.destino[idx]},
      {label:'Complemento específico (general o básico)', monthly: d.especifico[idx]},
      {label:'Sexenios', monthly: sexAnual},
    ];
    if (cargoInspector !== 0) items.push({label:'Complemento específico singular', monthly: cargoInspector});
    if (jefeDept !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
    if (si(flags.maestroESO) && d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: d.adicionalESO[idx]});
    return items;
  }
};

// ---------- NAVARRA (completely different model) ----------
// Re-verificado 2026-09-22 (a petición del usuario) contra "Retribuciones 2026.pdf"
// (educacion.navarra.es, Ley Foral 16/2025 de Presupuestos, art. 19) y cruzado contra la "Guía del
// Profesorado 2026-2027" de ANPE Navarra (documentos.anpenavarra.es), página 10, que trae una tabla
// directa (no en %) con las mismas cifras. El documento oficial solo publica PORCENTAJES sobre el
// "sueldo inicial" docente (1.900,21€ para Maestros/Sect.Sing.FP, 2.258,75€ para Secundaria/
// Catedráticos — ver overrides.sueldoBase), no importes en euros — pero al aplicar esos porcentajes se
// reproducen EXACTAS las cifras que ya usaba el motor, así que quedan confirmadas, no como "sin
// documento": especifico = sueldo inicial × 33,48% (Secundaria, =756,23€), ×39,48% (Catedráticos,
// =891,75€), ×45,17% (Sect.Sing.FP, sobre 1.900,21€, ≈858,32€), ×38,07% (Maestros, sobre 1.900,21€,
// =723,41€ — la guía ANPE redondea a 723,40€, 1 céntimo, irrelevante). "Maestro de ESO" tiene DOS
// componentes en el documento — "C.Específico Doc." = cuantía de Secundaria (756,23€, sustituye la de
// Maestros) + "C.Especial ESO" = 5,45% del sueldo inicial (103,56€) — que sumados dan exactos los
// 859,79€ ya usados; el delta que aplica adicionalESO (136,38€) es 723,41→859,79, matemáticamente
// idéntico a esa descomposición oficial (32,82+103,56=136,38€), así que también queda confirmado.
// ladderMaestros/ladderPES coinciden exactos con la tabla directa de la guía ANPE. Cargo directivo
// (CARGO_RAW['Navarra']) también se reproduce exacto aplicando los porcentajes del Decreto Foral
// 71/2012 (Director/Vicedirector/Jefatura de Estudios/Secretario por tamaño de centro) sobre el mismo
// sueldo inicial — confirmado para la inmensa mayoría de celdas. Específico de Inspección (1.087,51€,
// idx8) sigue SIN confirmar: ninguno de los dos documentos da un porcentaje ni cifra propia para
// Inspección Educativa (solo "Dedicación exclusiva" 55% y "Puesto de trabajo" 17,88%, que no reproducen
// 1.087,51€ de forma clara combinados con la base de Catedráticos). Jefe de Departamento sigue en 0€
// pese a que el documento SÍ tiene un porcentaje real (3%/6%/9% del sueldo inicial según nº de
// profesores del departamento, → 67,76€/135,53€/203,29€) — no modelado por falta de un selector de
// tamaño de departamento; pendiente de decidir si añadirlo con un tramo representativo (mismo patrón
// que Madrid).
COMUNIDADES['Navarra'] = {
  // Navarra has its own sueldoBase from the Ministry-generic default (see GENERIC_DATA below), and
  // structurally has NO extraSueldoBase/trienios/extraTrienio concept at all — its calc() computes
  // "extra sueldo base" as literally equal to sueldoBase and has no trienios ladder. Only sueldoBase
  // is ever resolved/overridden for Navarra; genericFields lists just the fields it actually has.
  genericFields: ['sueldoBase', 'muface', 'clasesPasivas'],
  overrides: {
    sueldoBase: arr9(1900.21,1900.21,1900.21,2258.75,2258.75,2258.75,2258.75,2258.75,2258.75)
  },
  salaryData: {
    especifico: arr9(723.41,858.32,858.32,756.23,756.23,756.23,756.23,891.75,1087.51),
    // Corrected 2026-09-19: the official Navarra 2026 table has a distinct, higher "Complemento
    // específico docente" for Maestros que imparten 1º/2º de la ESO (859,79€) vs. plain Maestros
    // (723,40/723,41€) — modeled the same way every other comunidad handles this flag: as an
    // additive delta (859.79-723.41=136.38) on top of the base especifico, only for idx0 (597-
    // Maestros), gated on the "Maestro 1º/2º ESO" selector.
    adicionalESO: onlyF(136.38),
    // Jefe de Departamento (añadido 2026-09-22, a petición del usuario, mismo patrón que Madrid): el
    // documento oficial (Ley Foral 16/2025, art. 19, apdo. "I.- Jefe de departamento didáctico y jefe
    // de departamento de orientación") gradúa este complemento por nº de profesores del departamento —
    // 3% (4-6 profesores), 6% (7-10) ó 9% (más de 10) del "sueldo inicial" docente — sin selector de
    // tamaño de departamento en esta app, se usa el tramo intermedio (7-10 profesores, 6%) como
    // aproximación representativa, igual que Madrid con su Jefatura de Departamento por nº de miembros.
    // Solo aplica a Secundaria y superiores (idx3-7): "departamento didáctico" no existe en Primaria
    // (idx0-2, sin jefeDepartamento) ni en Inspección (idx8) — mismo patrón que Andalucía/Aragón/etc.
    // 6% de 2.258,75€ (sueldo inicial Secundaria/A1) = 135,53€.
    jefeDepartamento: arr9(0,0,0,135.53,135.53,135.53,135.53,135.53,0),
    // antigüedad ladder amounts, maestros-side (AB) used for idx 0-2, PES-side (AC) for idx 3-8
    ladderMaestros: {
      5: 24.15, 6.583333: 195.17, 10: 219.32, 13.166667: 390.34, 15: 408.45,
      19.75: 579.47, 20: 597.59, 25: 609.66, 26.333333: 780.68, 30: 792.76,
      32.916667: 963.77, 35: 987.93, 40: 987.93
    },
    ladderPES: {
      5: 24.15, 6.583333: 227.44, 10: 251.59, 13.166667: 454.88, 15: 472.99,
      19.75: 676.28, 20: 694.39, 25: 706.47, 26.333333: 909.75, 30: 921.83,
      32.916667: 1125.12, 35: 1149.27, 40: 1149.27
    },
  },
  rules: {
    thresholds: [5, 6.583333, 10, 13.166667, 15, 19.75, 20, 25, 26.333333, 30, 32.916667, 35, 40]
  },
  calc(idx, anios, flags, cargoAmt, d, rules, today, items){
    const ladder = (idx<=2) ? d.ladderMaestros : d.ladderPES;
    // descending cascade: highest threshold <= anios wins
    let antig = 0;
    const sorted = [...rules.thresholds].sort((a,b)=>b-a);
    for (const t of sorted){ if (anios >= t) { antig = ladder[t]; break; } }
    const esoAdd = si(flags.maestroESO) ? d.adicionalESO[idx] : 0;
    const jefeDept = (d.jefeDepartamento && si(flags.jefeDepartamento)) ? d.jefeDepartamento[idx] : 0;
    const base = (d.sueldoBase[idx]+d.especifico[idx]+esoAdd+antig+jefeDept)*12
      + ((d.sueldoBase[idx]+d.especifico[idx]+esoAdd+antig+jefeDept)*2) // Extra Sueldo Base = Sueldo Base for Navarra (r631=+r630)
      + cargoAmt*14;
    if (items){
      items.push({label:'Sueldo base', monthly: d.sueldoBase[idx]});
      items.push({label:'Complemento específico (general o básico)', monthly: d.especifico[idx]});
      // Corrected 2026-09-22 (a petición del usuario, "el check de Maestro ESO no muestra el
      // concepto"): esoAdd used to be folded silently into the específico line above (same total,
      // but no visible "Adicional Maestro ESO" row and no obvious change when toggling the switch) —
      // now itemized as its own line, matching every other comunidad's convention.
      if (d.adicionalESO[idx] !== 0) items.push({label:'Adicional Maestro ESO', monthly: esoAdd});
      if (d.jefeDepartamento && d.jefeDepartamento[idx] !== 0) items.push({label:'Jefe de departamento / coordinación', monthly: jefeDept});
      if (antig !== 0) items.push({label:'Antigüedad (escala de grados/quinquenios)', monthly: antig});
      // Source quirk (Nómina mensual!row41 for Navarra's column T): the ORDINARY total is
      // `=SUM(T17:T21)+T36` — Cargo directivo (row29) sits OUTSIDE the T17:T21 range, so it never
      // reaches the ordinary display. But T36 (added only when pagaExtra="si") is
      // `=IF($C$9="si",SUM(T17:T35),0)` — a full RE-SUM of the whole ordinary block, which DOES
      // include row29. So unlike every other community (where Cargo directivo is simply missing
      // from the whole paga-extra block), Navarra's paga-extra bonus genuinely re-includes it —
      // keepInPagaExtra opts this item out of the universal "exclude cargo from pagaExtraTotal" rule.
      items.push({label:'Cargo directivo', monthly: cargoAmt, displayMonthly: 0, hidden: true, keepInPagaExtra: true});
    }
    return base;
  }
};

// ============================================================================
// GENERIC DATA resolution: merges GENERIC_DATA with each community's own `overrides` into that
// community's live `salaryData` object, in place, for the six shared fields. Called once at load
// time (below) and again by the admin UI (via setOverride / a direct GENERIC_DATA edit) whenever
// generic values or overrides change, so def.salaryData stays the single source of truth that
// calc()/computeCommunity() already read from — no parallel state, no changes to calc() itself.
// ============================================================================
function resolveSalaryData(community){
  const def = COMUNIDADES[community];
  if (!def) return;
  const overrides = def.overrides || {};
  const fields = def.genericFields || GENERIC_FIELDS;
  fields.forEach(f => {
    def.salaryData[f] = (overrides[f] || GENERIC_DATA[f]).slice();
  });
}
function resolveAllSalaryData(){
  for (const community of Object.keys(COMUNIDADES)) resolveSalaryData(community);
}
// field must be one of GENERIC_FIELDS and applicable to the community (see genericFields above).
function getOverride(community, field){
  const def = COMUNIDADES[community];
  if (!def || !def.overrides) return null;
  return def.overrides[field] || null;
}
function setOverride(community, field, arrayOrNull){
  const def = COMUNIDADES[community];
  if (!def) return;
  if (!def.overrides) def.overrides = {};
  if (arrayOrNull){
    def.overrides[field] = arrayOrNull.slice();
  } else {
    delete def.overrides[field];
  }
  resolveSalaryData(community);
}
function setGenericData(field, array){
  GENERIC_DATA[field] = array.slice();
  resolveAllSalaryData();
}
resolveAllSalaryData();

// ============================================================================
// NATIONAL layer (Nómina mensual): MUFACE/SS split, monthly, líquido, comparisons
// ============================================================================
const COMUNIDAD_ORDER = ['Andalucía','Aragón','Asturias','Baleares (Islas)','Canarias','Cantabria',
  'Castilla La Mancha','Castilla y León','Cataluña','Extremadura','Galicia','La Rioja','Madrid',
  'Murcia','Valencia','Ceuta y Melilla','País Vasco','Navarra'];

function getCargoAmount(community, groupAG, tipoCentro, cargo){
  const t = CARGO_TABLE[community];
  if (!t) return 0;
  const table = t[groupAG];
  if (!table || !table[tipoCentro]) return 0;
  const v = table[tipoCentro][cargo];
  if (v === CARGO_ERROR) return CARGO_ERROR;
  return (typeof v === 'number') ? v : 0;
}
function setCargoTable(community, groupAG, tipoCentro, cargo, value){
  if (!CARGO_TABLE[community]) CARGO_TABLE[community] = emptyCargoTable();
  CARGO_TABLE[community][groupAG][tipoCentro][cargo] = value;
}

// Complementos singulares por cargo — regla común a TODAS las comunidades (2026-09-22, indicada por el
// usuario): el Complemento de cargo de Inspector, el Cargo directivo (Dirección/Jefatura/Secretaría...) y
// el Jefe de departamento/coordinación NO se solapan; solo se cobra el de mayor importe. Se aplica aquí,
// de forma central, en vez de en cada calc(): devuelve el cargoAmt efectivo, la bandera de jefe de
// departamento a usar y una copia de salaryData con el complemento de Inspector a 0 si pierde. En caso de
// empate se conserva primero el cargo directivo, luego el de Inspector y por último el jefe de dpto.
// (no cambia el total, solo cuál se muestra). No cubre los "singulares" con otro nombre de campo
// (p. ej. Murcia `especificoSingular`, que forma parte de su específico y no es un complemento de cargo).
function resolveSingulares(def, idx, jefeFlag, cargoAmt){
  const d = def.salaryData;
  const jefeAmt = (d.jefeDepartamento && si(jefeFlag)) ? (d.jefeDepartamento[idx] || 0) : 0;
  const inspAmt = d.complementoCargoInspector ? (d.complementoCargoInspector[idx] || 0) : 0;
  const cargo = cargoAmt || 0;
  const max = Math.max(cargo, jefeAmt, inspAmt);
  const keep = cargo >= max ? 'cargo' : (inspAmt >= max ? 'inspector' : 'jefe');
  const dropInsp = inspAmt > 0 && keep !== 'inspector';
  return {
    cargoAmt: keep === 'cargo' ? cargoAmt : 0,
    jefeFlag: (jefeAmt > 0 && keep !== 'jefe') ? 'NO' : jefeFlag,
    sd: dropInsp ? Object.assign({}, d, { complementoCargoInspector: d.complementoCargoInspector.map(() => 0) }) : d,
    keep
  };
}
// Misma resolución a partir de un perfil (para la UI: la paga extra itemizada llama a
// def.pagaExtraItems con el perfil y salaryData, y necesita los mismos datos ya resueltos).
function resolveSingularesFor(community, profile){
  const def = COMUNIDADES[community];
  const idx = cuerpoIndex(profile.cuerpo);
  const grp = resolveCargoGroup(community, idx, profile.tablaCargo);
  const raw = getCargoAmount(community, grp, profile.tipoCentro, profile.cargoDirectivo);
  const cargoAmt = (idx === 8 || raw === CARGO_ERROR) ? 0 : raw;
  return resolveSingulares(def, idx, profile.jefeDepartamento, cargoAmt);
}

// Compute one community's full breakdown for a given profile.
// wantItems: when true, also returns an `items` array of itemized monthly concepts
// (for the "Su nómina" payslip view). This is purely additive read-only reporting —
// it never changes `annual`, which stays bit-for-bit identical to the validated value.
function computeCommunity(community, profile, today, wantItems){
  today = today || new Date();
  const def = COMUNIDADES[community];
  if (!def) throw new Error('Unknown community '+community);
  const idx = cuerpoIndex(profile.cuerpo);
  const grp = resolveCargoGroup(community, idx, profile.tablaCargo);
  const cargoAmtRaw = getCargoAmount(community, grp, profile.tipoCentro, profile.cargoDirectivo);
  if (cargoAmtRaw === CARGO_ERROR){
    const key = `${community}|${grp}|${profile.tipoCentro}|${profile.cargoDirectivo}`;
    const message = CARGO_ERROR_MESSAGES[key] ||
      'Dato no disponible en el Excel original (error de fórmula heredado) para esta combinación de tipo de centro y cargo directivo en ' + community + '.';
    return { error: true, message };
  }
  // Genuine source-workbook quirk (confirmed across every community's Retribuciones block):
  // the "Cargo directivo" row's IF($C$1=...) formula is present only for columns F..M
  // (597..511); column N (510-Inspección) has no formula at all (blank => 0). Inspectors
  // never receive cargo-directivo pay in the original workbook, regardless of C12 selection.
  const cargoAmt = (idx === 8) ? 0 : cargoAmtRaw;
  // Baleares' calc() reads flags.funcionario==='carrera' to gate its seniority-scaled autonomous
  // complement — a structurally different concept from the national 3-way "Situación Laboral" field
  // (it means "not an interino/prácticas hire"). Map the new field onto that same boolean: anything
  // other than Interino/Laboral (i.e. either Clases Pasivas or S.Social) counts as "carrera", exactly
  // preserving Baleares' previously-validated behavior.
  const situFlag = normSituacion(profile.situacionLaboral);
  const flags = {
    maestroESO: profile.maestroESO, tutor: profile.tutor,
    islaNoCapitalina: profile.islaNoCapitalina, funcionario: situFlag === 'interino' ? 'interino' : 'carrera',
    islaBaleares: profile.islaBaleares, vallAran: profile.vallAran, jefeDepartamento: profile.jefeDepartamento,
    carreraGeneral: profile.carreraGeneral,
    // 598-PESSFP is normally a pure alias onto idx1 (591/596's data slot, see CUERPO_ALIASES above),
    // but Galicia's "Complemento de profesor de FP" is a genuine exception: it applies to 591 only,
    // not to 598 despite sharing the same idx — see Galicia's calc().
    is598: profile.cuerpo === CUERPO_598_LABEL
  };
  const sing = resolveSingulares(def, idx, flags.jefeDepartamento, cargoAmt);
  flags.jefeDepartamento = sing.jefeFlag;
  const dEff = sing.sd;
  const items = wantItems ? [] : undefined;
  const annual = def.calc(idx, profile.anios, flags, sing.cargoAmt, dEff, def.rules, today, items);
  const muface = def.salaryData.muface[idx];
  const clasesPasivas = def.salaryData.clasesPasivas[idx];
  let mensualBruto, pagaExtraTotal;
  if (wantItems){
    {
      const cargoItem = items.find(it => it.label === 'Cargo directivo');
      // Genuine source-workbook quirk (idx===8, Inspección): the annual total's own Cargo directivo
      // row has no formula for column N (blank => 0, see cargoAmt above), but the "Nómina mensual"
      // sheet's row29 has its own INDEX/MATCH for every column including N — not zeroed there.
      // (Skip if the community already set its own displayMonthly, e.g. Navarra's structural hide.)
      if (cargoItem && typeof cargoAmtRaw === 'number' && cargoItem.displayMonthly === undefined) cargoItem.displayMonthly = (idx === 8) ? cargoAmtRaw : sing.cargoAmt;
    }
    // Every item may carry two figures:
    //  - `monthly`: the concept's true ×12-rate contribution, exactly mirroring what the (already
    //    validated) annual formula counts at the ordinary/×12 rate. Used ONLY to derive
    //    pagaExtraTotal below, via the algebraic identity annual = trueOrdinary*12 + pagaExtraTotal*2
    //    (every community's calc() is structured this way — sometimes combined as *14 when the two
    //    rates are equal — so this identity always holds exactly).
    //  - `displayMonthly` (optional, defaults to `monthly`): what's actually shown/used for the
    //    ordinary "Nómina mensual" total. It only differs from `monthly` for a handful of confirmed
    //    annual-vs-display divergences (a display row gated differently than the annual formula, or
    //    a concept the "Nómina mensual" sheet never displays at all) — see the per-item comments.
    // `extraOnly` items (concepts the annual formula only ever pays via its ×2/paga-extra term, e.g.
    // Aragón's CEA) are excluded from both sums; their annual weight is picked up automatically by
    // pagaExtraTotal's subtraction.
    const trueOrdinary = items.filter(it => !it.extraOnly).reduce((s, it) => s + it.monthly, 0);
    mensualBruto = items.filter(it => !it.extraOnly).reduce((s, it) => s + (it.displayMonthly !== undefined ? it.displayMonthly : it.monthly), 0);
    pagaExtraTotal = (annual - trueOrdinary * 12) / 2;
    // Universal source-workbook quirk, confirmed across the "Nómina mensual" sheet dump for every
    // community: the "Paga extra, ..." row block (rows 34-39/40) never includes a mirror row for
    // Cargo directivo, even though the annual formula pays it at the combined ×14 rate (validated).
    // It IS shown normally in the ordinary monthly total (see displayMonthly above), just never
    // repeated as a separate June/December payment — so exclude it from the derived pagaExtraTotal.
    const cargoItemForExtra = items.find(it => it.label === 'Cargo directivo');
    if (cargoItemForExtra && !cargoItemForExtra.keepInPagaExtra) pagaExtraTotal -= cargoItemForExtra.monthly;
    // A handful of communities have a concept that genuinely contributes to the annual formula's
    // ×2 term (validated) but has NO corresponding row anywhere in the source "Nómina mensual"
    // sheet's paga-extra block (confirmed against the sheet dump) — def.pagaExtraAdjust exposes
    // that known, per-community constant so it can be excluded from the derived total.
    if (typeof def.pagaExtraAdjust === 'function'){
      pagaExtraTotal -= def.pagaExtraAdjust(idx, profile.anios, flags, dEff, def.rules);
    }
    // A few communities' real "Nómina mensual" paga-extra block is structurally different from the
    // generic identity above (own reduced rates, own concepts) — def.pagaExtraOverride replaces the
    // derived total outright with the real formula (confirmed against the source sheet dump), while
    // `annual` itself (and thus mensualBruto's ordinary-month figure) stays untouched/validated.
    if (typeof def.pagaExtraOverride === 'function'){
      pagaExtraTotal = def.pagaExtraOverride(idx, profile.anios, flags, dEff, def.rules);
    }
  }
  return { annual, muface, clasesPasivas, items, mensualBruto, pagaExtraTotal };
}

// National MUFACE/Derechos Pasivos/Seguridad Social + IRPF + líquido, uniform across all 18
// communities. Extracted cell-by-cell from the real individual payslip file "Nómina La Rioja
// (Enero 2026).xlsx" (a national civil-service payroll rule, not La-Rioja-specific — applied
// uniformly here exactly like MUFACE/Derechos Pasivos already are):
//   F15 Cuotas Muface                        = 0 si Interino/Laboral; si no, la cuota MUFACE de la
//                                               comunidad (la pagan tanto Clases Pasivas como S.Social)
//   F16 Derechos Pasivos                     = 0 salvo Situación = Clases Pasivas, entonces la cifra
//                                               de Derechos Pasivos/Clases Pasivas de la comunidad
//   F17 Cotización SS Contingencias Comunes  = 0 si Clases Pasivas; 4,45% de la base mensual si
//                                               S.Social; 4,7% de la base mensual si Interino/Laboral
//   F18 Cotización SS Desempleo y FP         = 0 salvo Interino/Laboral, entonces 1,65% de la base
//   F20 Cotización M.E.I.                    = 0 si Clases Pasivas; 0,15% de la base si S.Social o
//                                               Interino/Laboral
// "base mensual" reuses the exact same annual/12 base the old binary interino branch already used.
function computeNational(community, profile, today, wantItems){
  const r = computeCommunity(community, profile, today, true);
  if (r.error) return r;
  const { annual, muface, clasesPasivas, items, pagaExtraTotal } = r;
  const situ = normSituacion(profile.situacionLaboral);
  const pagaExtra = si(profile.pagaExtra);
  const baseCotizSS = annual/12;
  const cuotasMuface = (situ === 'interino') ? 0 : (pagaExtra ? 2*muface : muface);
  const derechosPasivos = (situ === 'clasesPasivas') ? (pagaExtra ? -2*clasesPasivas : -clasesPasivas) : 0;
  // Tipos oficiales de cotización 2026 (BOE, Orden PJC/297/2026, de 30 de marzo, "de cotización a la
  // Seguridad Social... para el ejercicio 2026") — verificados 2026-09-19, sustituyen a los tipos
  // aproximados heredados del Excel maestro (que usaba un 4,82% sin separar Contingencias de MEI, y
  // 1,55% de Desempleo, que es el tipo de contrato INDEFINIDO en vez del temporal que corresponde a
  // un interino docente):
  //  - Contingencias Comunes, cuota obrera Régimen General: 4,70% — igual para "Funcionario Seguridad
  //    Social" e "Interino o Laboral". No existe un tipo reducido oficial verificado específico para
  //    el colectivo MUFACE-Seguridad-Social (funcionario MUFACE que cotiza a la Seguridad Social para
  //    pensiones en vez de Clases Pasivas): su protección por pensiones es la del Régimen General, así
  //    que se le aplica el mismo 4,70% que a cualquier otro trabajador de ese régimen.
  //  - MEI (Mecanismo de Equidad Intergeneracional): 0,15% — aplica a Funcionario S.Social e Interino,
  //    no a Clases Pasivas (su pensión no depende de la Seguridad Social).
  //  - Desempleo: 1,60% — tipo de CONTRATO TEMPORAL (el que corresponde a un interino docente), no el
  //    1,55% de contrato indefinido que usaba el Excel maestro. Solo Interino/Laboral.
  //  - Formación Profesional: 0,10% — sin cambios respecto al Excel maestro (ya era el tipo oficial
  //    correcto). Solo Interino/Laboral.
  // Corregido 2026-09-19: para "Funcionario Seguridad Social" (MUFACE + RGSS a efectos de pensión,
  // NO Clases Pasivas), el tipo de Contingencias Comunes NO es el general del Régimen General (4,70%):
  // verificado por el usuario (4,45%, pendiente de confirmación oficial final) y corroborado por fuentes
  // independientes (guías sindicales/gestorías citan 4,476%–4,51% para funcionariado docente de RGSS
  // post-2011, todas en ese rango) — se usa 4,45% a falta de confirmación oficial más precisa. Para
  // Desempleo, el usuario confirma que las SUSTITUCIONES (el tipo de contrato temporal habitual de un
  // interino docente) cotizan al 1,55%, no al 1,60% general de contrato temporal.
  const cotizContingencias = (situ === 'clasesPasivas') ? 0
    : (situ === 'ssocial') ? -baseCotizSS*SS_RATES.contingenciasSSocial
    : -baseCotizSS*SS_RATES.contingenciasGeneral;
  const cotizDesempleo = (situ === 'interino') ? -baseCotizSS*SS_RATES.desempleo : 0;
  const cotizFP = (situ === 'interino') ? -baseCotizSS*SS_RATES.formacionProfesional : 0;
  const cotizMei = (situ === 'clasesPasivas') ? 0 : -baseCotizSS*SS_RATES.mei;
  // SUELDO BRUTO MENSUAL: ordinary monthly gross, plus (when "Nómina con Paga Extraordinaria" is
  // "SI") the extra payment for that month — matching the real Excel's monthly display, which is
  // NOT simply annual/12 (verified against expected_monthly in ground_truth_fixture.json).
  const mensualBruto = r.mensualBruto + (pagaExtra ? pagaExtraTotal : 0);
  const irpfPct = (typeof profile.irpf === 'number') ? profile.irpf : 0.24;
  const retencionIRPF = -mensualBruto*irpfPct;
  const totalGastos = cuotasMuface+derechosPasivos+cotizContingencias+cotizDesempleo+cotizFP+cotizMei+retencionIRPF;
  const liquido = mensualBruto + totalGastos;
  return { annual, mensualBruto, pagaExtraTotal, liquido, muface, clasesPasivas,
    cuotasMuface, derechosPasivos, cotizContingencias, cotizDesempleo, cotizFP, cotizMei,
    retencionIRPF, items: wantItems ? items : undefined };
}

function computeAll(profile, today, wantItems){
  const out = {};
  for (const c of COMUNIDAD_ORDER) out[c] = computeNational(c, profile, today, wantItems);
  return out;
}

global.SalaryEngine = {
  CUERPOS, CUERPO_ORDER: CUERPOS, CUERPO_SELECT_OPTIONS, CUERPO_ALIASES, CUERPO_598_LABEL, CUERPO_598_SHORT, COMUNIDADES, COMUNIDAD_ORDER, CARGOS, TIPOS,
  CARGO_TABLE, setCargoTable, getCargoAmount, emptyCargoTable,
  groupOf, cuerpoIndex, computeCommunity, computeNational, computeAll, normSituacion, resolveSingulares, resolveSingularesFor,
  GENERIC_DATA, GENERIC_FIELDS, SS_RATES, getOverride, setOverride, setGenericData,
  resolveSalaryData, resolveAllSalaryData, recalcMadridCargoDirectivo
};
if (typeof module !== 'undefined') module.exports = global.SalaryEngine;

})(typeof window !== 'undefined' ? window : global);
