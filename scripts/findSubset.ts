import * as fs from 'fs';

const txs: any[] = JSON.parse(fs.readFileSync('backups/prod_snapshot_2026-09-05.json', 'utf8'));

// Filter Interbank Egresos in Setiembre
const ibkEgrTxs = txs.filter(t => t.Entidad === 'Interbank' && t.Tipo === 'Egreso' && t.Mes === 'Setiembre');
console.log('Interbank Egreso txs in Setiembre:', ibkEgrTxs.length);

const target = 2214.91;
const total = ibkEgrTxs.reduce((a,b)=>a+b.Monto, 0);
console.log('Total Interbank Egresos in Setiembre:', total);
const diff = total - target;
console.log('Difference from target 2214.91:', diff);

// Find subset of transactions whose sum equals diff
function findSubset(arr: any[], targetSum: number) {
  const result: any[] = [];
  function backtrack(idx: number, currentSum: number, chosen: any[]) {
    if (Math.abs(currentSum - targetSum) < 0.01) {
      result.push([...chosen]);
      return;
    }
    if (currentSum > targetSum + 0.01 || idx >= arr.length) return;
    
    // Choose
    backtrack(idx + 1, currentSum + arr[idx].Monto, [...chosen, arr[idx]]);
    // Don't choose
    backtrack(idx + 1, currentSum, chosen);
  }
  backtrack(0, 0, []);
  return result;
}

const excludedSubsets = findSubset(ibkEgrTxs, diff);
console.log(`Found ${excludedSubsets.length} subsets matching difference ${diff}:`);
for (const sub of excludedSubsets) {
  console.log('--- Subset ---');
  sub.forEach(t => console.log(`  ${t.id}: ${t.Concepto} - S/ ${t.Monto} (${t.Fecha})`));
}
