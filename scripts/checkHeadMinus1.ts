import { execSync } from 'child_process';
import * as fs from 'fs';

// Get masterData.ts from HEAD~1
const raw = execSync('git show HEAD~1:src/utils/masterData.ts', { encoding: 'utf-8' });
fs.writeFileSync('scripts/tempOldMaster.ts', raw, 'utf-8');

import('./tempOldMaster.ts').then(mod => {
  const txs = mod.masterTransactions;
  console.log('Total txs in HEAD~1:', txs.length);

  const seti = txs.filter((t: any) => t.Mes === 'Setiembre');
  console.log('Setiembre txs in HEAD~1:', seti.length);

  const entityList = ['Interbank', 'BCP', 'BBVA Bfree', 'Interbank Amex', 'Ripley'];
  entityList.forEach(ent => {
    const ing = seti.filter((t: any) => t.Entidad === ent && t.Tipo === 'Ingreso').reduce((a: any, b: any) => a + b.Monto, 0);
    const egr = seti.filter((t: any) => t.Entidad === ent && t.Tipo === 'Egreso').reduce((a: any, b: any) => a + b.Monto, 0);
    console.log(`[${ent}] Ing: ${ing.toFixed(2)} | Egr: ${egr.toFixed(2)} | Saldo: ${(ing - egr).toFixed(2)}`);
  });
  
  fs.unlinkSync('scripts/tempOldMaster.ts');
});
