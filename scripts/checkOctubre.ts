import * as fs from 'fs';

const txs: any[] = JSON.parse(fs.readFileSync('backups/prod_snapshot_2026-09-05.json', 'utf8'));

const octu = txs.filter(t => t.Mes === 'Octubre');
console.log(`Total en Octubre: ${octu.length}`);

const entityList = ['Interbank', 'BCP', 'BBVA Bfree', 'Interbank Amex', 'Ripley'];
entityList.forEach(ent => {
  const ing = octu.filter(t => t.Entidad === ent && t.Tipo === 'Ingreso').reduce((a, b) => a + b.Monto, 0);
  const egr = octu.filter(t => t.Entidad === ent && t.Tipo === 'Egreso').reduce((a, b) => a + b.Monto, 0);
  console.log(`[${ent}] Ing: ${ing.toFixed(2)} | Egr: ${egr.toFixed(2)} | Saldo/Neto: ${(ing - egr).toFixed(2)}`);
});
