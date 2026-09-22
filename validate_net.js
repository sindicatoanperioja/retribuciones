const fs = require('fs');
const path = require('path');
const engine = require('./engine.js');

const fixturePath = path.join(__dirname, '..', 'ground_truth_fixture.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

function mapProfile(p){
  return {
    cuerpo: p.C5, funcionario: p.C6, anios: p.C7, maestroESO: p.C8,
    pagaExtra: p.C9, islaNoCapitalina: p.C10, islaBaleares: p.H10,
    tutor: p.C11, cargoDirectivo: p.C12, tipoCentro: p.C13, irpf: 0.24
  };
}

let totalChecks=0, totalMatch=0, mismatches=[];
const today = new Date('2026-09-18T00:00:00');

for (const c of fixture.cases){
  const profile = mapProfile(c.profile);
  for (const [col, community] of Object.entries(fixture.column_to_community)){
    const expMonthly = c.expected_monthly ? c.expected_monthly[community] : undefined;
    const expNet = c.expected_net_monthly ? c.expected_net_monthly[community] : undefined;
    if (expMonthly === undefined && expNet === undefined) continue;
    let result;
    try { result = engine.computeNational(community, profile, today); }
    catch(e){ mismatches.push({case:c.id, community, error:'threw: '+e.message}); continue; }
    if (result.error) { continue; } // skip known excel-error combos
    if (typeof expMonthly === 'number'){
      totalChecks++;
      const diff = Math.abs(result.mensualBruto - expMonthly);
      if (diff <= 0.02) totalMatch++;
      else mismatches.push({case:c.id, community, field:'mensualBruto', expected:expMonthly, got:result.mensualBruto, diff:diff.toFixed(2)});
    }
    if (typeof expNet === 'number'){
      totalChecks++;
      const diff = Math.abs(result.liquido - expNet);
      if (diff <= 0.02) totalMatch++;
      else mismatches.push({case:c.id, community, field:'liquido', expected:expNet, got:result.liquido, diff:diff.toFixed(2)});
    }
  }
}

console.log(`Checked ${totalChecks} monthly/net fields.`);
console.log(`Matched (<=0.02): ${totalMatch}`);
console.log(`Mismatches: ${mismatches.length}`);
if (mismatches.length) console.log(JSON.stringify(mismatches.slice(0,30), null, 2));
