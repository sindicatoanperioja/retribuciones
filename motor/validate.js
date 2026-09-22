const fs = require('fs');
const path = require('path');
const engine = require('./engine.js');

const fixturePath = path.join(__dirname, 'ground_truth_fixture.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const CUERPO_MAP = {}; // fixture uses raw excel strings like '597-Maestros' already matching engine.CUERPOS

function mapProfile(p){
  return {
    cuerpo: p.C5,
    funcionario: p.C6,
    anios: p.C7,
    maestroESO: p.C8,
    pagaExtra: p.C9,
    islaNoCapitalina: p.C10,
    islaBaleares: p.H10,
    tutor: p.C11,
    cargoDirectivo: p.C12,
    tipoCentro: p.C13,
    irpf: 0.24
  };
}

let totalChecks=0, totalMatch=0, mismatches=[];
const today = new Date('2026-09-18T00:00:00'); // "today" per session context

for (const c of fixture.cases){
  const profile = mapProfile(c.profile);
  let result;
  try { result = engine.computeAll(profile, today); }
  catch(e){ mismatches.push({case:c.id, community:'ALL', error:'engine threw: '+e.message}); continue; }
  for (const [col, community] of Object.entries(fixture.column_to_community)){
    const expected = c.expected_annual[community];
    totalChecks++;
    const got = result[community];
    if (typeof expected === 'string'){
      // expected is a literal Excel error string e.g. '#REF!' or '#VALOR!'
      if (got && got.error){ totalMatch++; }
      else { mismatches.push({case:c.id, community, expected, got: got ? got.annual : got, note:'expected ERROR, engine returned a number'}); }
      continue;
    }
    if (got && got.error){
      mismatches.push({case:c.id, community, expected, got:'ENGINE_ERROR: '+got.message});
      continue;
    }
    const diff = Math.abs(got.annual - expected);
    if (diff <= 0.01) totalMatch++;
    else mismatches.push({case:c.id, community, expected, got: got.annual, diff: diff.toFixed(2)});
  }
}

console.log(`Checked ${totalChecks} (case,community) pairs across ${fixture.cases.length} cases.`);
console.log(`Matched to the cent: ${totalMatch}`);
console.log(`Mismatches: ${mismatches.length}`);
if (mismatches.length){
  console.log(JSON.stringify(mismatches, null, 2));
}
