// Pruebas de coherencia de la simulación (no comparan con el Excel, sino con reglas que siempre deben
// cumplirse). Uso: node audit.js   (sale con código 1 si hay incidencias no justificadas)
// Se añadió el 2026-10-02 tras una auditoría de anomalías que encontró errores que ningún caso de
// ground_truth_fixture.json cubría (carrera de Castilla y León sumada, residencia de Ceuta y Melilla ×14, ...).
const E = require('./engine.js');
const today = new Date('2026-10-02');
const CCAA = E.COMUNIDAD_ORDER;
const CUERPOS = E.CUERPO_SELECT_OPTIONS;
const short = c => c.split('-')[0];
const base = { cuerpo:'590-Profesores Enseñanza Secundaria', situacionLaboral:'ssocial', anios:12, maestroESO:'NO', tutor:'NO',
  jefeDepartamento:'NO', directorEOEP:'NO', carreraGeneral:'NO', cargoDirectivo:'Sin cargo', tipoCentro:'A',
  islaNoCapitalina:'NO', islaBaleares:'Mallorca', vallAran:'NO', pagaExtra:'NO', irpf:0.19 };
const P = o => ({ ...base, ...o });
const calc = (c, p, items) => { try { return E.computeNational(c, p, today, items); } catch(e){ return { error:true, message:String(e) }; } };
const findings = {};
const add = (k, m) => { (findings[k] = findings[k] || []).push(m); };

// Excepciones conocidas y justificadas (cada una con su motivo):
const ALLOW = {
  // El complemento autonómico de Baleares depende de ser funcionario de carrera o interino (documentado).
  'Bruto-depende-situación': c => c === 'Baleares (Islas)',
};

// 1. NaN / errores / negativos / líquido > bruto
for (const c of CCAA) for (const cu of CUERPOS) for (const an of [0,3,6,12,18,24,30,36]) for (const pe of ['NO','SI']) {
  const r = calc(c, P({ cuerpo:cu, anios:an, pagaExtra:pe, maestroESO:'SI', tutor:'SI', jefeDepartamento:'SI', carreraGeneral:'SI' }), true);
  if (r.error) { add('ERROR', `${c} | ${short(cu)} | ${an}a | ${r.message}`); continue; }
  for (const k of ['annual','mensualBruto','liquido','pagaExtraTotal']) if (!isFinite(r[k])) add('NaN', `${c} | ${short(cu)} | ${an}a | ${k}`);
  for (const it of r.items) if (it.monthly < -0.005) add('Item-negativo', `${c} | ${short(cu)} | ${it.label}=${it.monthly}`);
  if (r.liquido > r.mensualBruto + 0.01) add('Liquido>Bruto', `${c} | ${short(cu)} | ${an}a`);
  if (r.pagaExtraTotal < -0.01) add('PagaExtra-negativa', `${c} | ${short(cu)} | ${an}a`);
}

// 2. El total anual debe cuadrar con 12 × mes ordinario + 2 × paga extra (con y sin cargo directivo / jefe / EOEP)
const variantes = [{}, { cargoDirectivo:'Dirección', tablaCargo:'A2' }, { cargoDirectivo:'Dirección', tablaCargo:'A1' }, { jefeDepartamento:'SI' }, { directorEOEP:'SI' }];
for (const c of CCAA) for (const cu of CUERPOS) for (const an of [0,6,12,25]) for (const v of variantes) {
  const r = calc(c, P({ cuerpo:cu, anios:an, ...v }), true); if (r.error) continue;
  const d = r.annual - (r.mensualBruto*12 + r.pagaExtraTotal*2);
  if (Math.abs(d) > 1) add('Anual≠12*mes+2*extra', `${c} | ${short(cu)} | ${an}a | ${JSON.stringify(v)} | dif ${d.toFixed(0)}`);
}

// 3. Antigüedad: nunca baja
for (const c of CCAA) for (const cu of CUERPOS) {
  let prev = -1;
  for (let an = 0; an <= 40; an++) {
    const r = calc(c, P({ cuerpo:cu, anios:an })); if (r.error) break;
    if (prev >= 0 && r.annual < prev - 0.01) add('Baja-con-antigüedad', `${c} | ${short(cu)} | ${an-1}→${an}a`);
    prev = r.annual;
  }
}

// 4. Un interruptor activado nunca baja el sueldo
for (const c of CCAA) for (const cu of CUERPOS) for (const an of [0,8,15,28]) {
  const r0 = calc(c, P({ cuerpo:cu, anios:an })); if (r0.error) continue;
  for (const sw of ['maestroESO','tutor','jefeDepartamento','carreraGeneral','directorEOEP']) {
    const r1 = calc(c, P({ cuerpo:cu, anios:an, [sw]:'SI' }));
    if (r1.annual < r0.annual - 0.01) add('Interruptor-baja', `${c} | ${short(cu)} | ${an}a | ${sw}`);
  }
}

// 5. Cargo directivo: más tamaño (A) nunca paga menos que menos tamaño (F)
for (const c of CCAA) for (const cu of ['597-Maestros','590-Profesores Enseñanza Secundaria']) for (const cargo of E.CARGOS.slice(1)) {
  let prev = Infinity;
  for (const t of E.TIPOS) {
    const r = calc(c, P({ cuerpo:cu, cargoDirectivo:cargo, tipoCentro:t })); if (r.error) continue;
    if (r.annual > prev + 0.01) add('Cargo-sube-al-bajar-tamaño', `${c} | ${short(cu)} | ${cargo} | tipo ${t}`);
    prev = r.annual;
  }
}

// 6. Jerarquía de cuerpos
for (const c of CCAA) for (const an of [0,12,25]) {
  const g = n => calc(c, P({ cuerpo:n, anios:an })).annual;
  const insp=g('510-Inspección'), cat=g('511-Catedráticos'), sec=g('590-Profesores Enseñanza Secundaria'), mae=g('597-Maestros'), ptfp=g('591-Profesores Técnicos de Formación Profesional');
  if (insp < cat) add('Inspección<Catedráticos', `${c} | ${an}a`);
  if (cat < sec) add('Catedráticos<Secundaria', `${c} | ${an}a`);
  if (sec < mae) add('Secundaria<Maestros', `${c} | ${an}a`);
  if (ptfp > sec + 1) add('PTFP>Secundaria', `${c} | ${an}a`);
}

// 7. El bruto no depende de la situación laboral (solo las deducciones)
for (const c of CCAA) {
  const a = calc(c, P({ situacionLaboral:'ssocial' })).annual, b = calc(c, P({ situacionLaboral:'interino' })).annual, d = calc(c, P({ situacionLaboral:'clasesPasivas' })).annual;
  if ((Math.abs(a-b) > 0.01 || Math.abs(a-d) > 0.01) && !(ALLOW['Bruto-depende-situación'](c))) add('Bruto-depende-situación', `${c}`);
}

// 8. Cargo + jefe dpto + EOEP: nunca se suman (solo el mayor)
for (const c of CCAA) {
  const cu = '590-Profesores Enseñanza Secundaria', r0 = calc(c, P({ cuerpo:cu })).annual;
  const only = k => calc(c, P({ cuerpo:cu, ...k })).annual - r0;
  const a = only({ cargoDirectivo:'Dirección', tablaCargo:'A1' }), b = only({ jefeDepartamento:'SI' }), d = only({ directorEOEP:'SI' });
  const all = only({ cargoDirectivo:'Dirección', tablaCargo:'A1', jefeDepartamento:'SI', directorEOEP:'SI' });
  if (all > Math.max(a,b,d) + 0.01) add('Singulares-se-suman', `${c}`);
}

// 9. Inspección: los interruptores de docente no le suman nada
for (const c of CCAA) {
  const r0 = calc(c, P({ cuerpo:'510-Inspección' })).annual;
  const r1 = calc(c, P({ cuerpo:'510-Inspección', tutor:'SI', jefeDepartamento:'SI', directorEOEP:'SI', maestroESO:'SI' })).annual;
  if (Math.abs(r1 - r0) > 0.01) add('Inspección-con-interruptores', `${c}`);
}

// 10. Paga extra: el desglose itemizado debe sumar el total (sin fila "Ajuste") — mismo camino que la UI
const isZero = v => Math.abs(v) < 0.005;
const perfilesExtra = [
  {}, { anios:25, tutor:'SI', jefeDepartamento:'SI', carreraGeneral:'SI' }, { cuerpo:'597-Maestros', maestroESO:'SI' },
  { cuerpo:'597-Maestros', cargoDirectivo:'Dirección', tablaCargo:'A2' }, { cuerpo:'510-Inspección', anios:25 },
  { directorEOEP:'SI' }, { situacionLaboral:'interino', cuerpo:'598-Profesores especialistas en sectores singulares de FP' },
];
for (const o of perfilesExtra) for (const c of CCAA) {
  const profile = P({ pagaExtra:'SI', ...o });
  const r = calc(c, profile, true); if (r.error) continue;
  const def = E.COMUNIDADES[c], sd = def.salaryData, idx = E.cuerpoIndex(profile.cuerpo), b = Math.trunc(profile.anios/3);
  const items = r.items.filter(it => !it.extraOnly && !it.hidden && !isZero(it.displayMonthly !== undefined ? it.displayMonthly : it.monthly));
  const real = E.pagaExtraItemsFor(c, profile);
  const extraRows = (real || items.map(it => {
    let v;
    if (it.label === 'Sueldo base') v = sd.extraSueldoBase ? sd.extraSueldoBase[idx] : it.monthly;
    else if (it.label === 'Trienios') v = sd.extraTrienio ? sd.extraTrienio[idx]*b : it.monthly;
    else v = it.displayMonthly !== undefined ? it.displayMonthly : it.monthly;
    return { label: it.label, monthly: v };
  }).filter(Boolean)).concat(r.items.filter(it => it.extraOnly && !isZero(it.monthly)).map(it => ({ monthly: it.monthly })));
  const ajuste = r.pagaExtraTotal - extraRows.reduce((s,it) => s + it.monthly, 0);
  if (!isZero(ajuste)) add('Paga-extra-con-Ajuste', `${c} | ${JSON.stringify(o)} | ${ajuste.toFixed(2)}`);
  const calcLiq = r.mensualBruto + r.cuotasMuface + r.derechosPasivos + r.cotizContingencias + r.cotizDesempleo + r.cotizFP + r.cotizMei + r.retencionIRPF;
  if (Math.abs(calcLiq - r.liquido) > 0.01) add('Liquido-no-cuadra', `${c}`);
}

let total = 0;
for (const [k, arr] of Object.entries(findings)) {
  total += arr.length;
  console.log(`\n=== ${k} (${arr.length}) ===`);
  arr.slice(0, 15).forEach(m => console.log('  ' + m));
  if (arr.length > 15) console.log(`  ... y ${arr.length-15} más`);
}
console.log(total ? `\n${total} incidencias` : 'Sin incidencias: todas las comprobaciones de coherencia pasan.');
process.exit(total ? 1 : 0);
