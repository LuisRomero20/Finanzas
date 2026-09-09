import { masterTransactions } from '../src/utils/masterData';

// Simulate Dashboard.tsx for month 'Setiembre'
const selectedMonth = 'Setiembre';
const filtered = masterTransactions.filter(t => t.Mes === selectedMonth);

const entityList = ['Interbank', 'BCP', 'BBVA Bfree', 'Interbank Amex', 'Ripley'];

const entityBalances: Record<string, number> = {};
const entityIngresos: Record<string, number> = {};
const entityEgresos: Record<string, number> = {};

entityList.forEach(ent => {
  const ingresos = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Ingreso').reduce((a, t) => a + t.Monto, 0);
  const egresos = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Egreso').reduce((a, t) => a + t.Monto, 0);
  entityIngresos[ent] = ingresos;
  entityEgresos[ent] = egresos;
  entityBalances[ent] = ingresos - egresos;
});

console.log('=== CALCULADO ACTUALMENTE EN MASTERDATA PARA SETIEMBRE ===');
entityList.forEach(ent => {
  console.log(`[${ent}]`);
  console.log(`   Ingresos (Cargos si tarjeta): S/ ${entityIngresos[ent].toFixed(2)}`);
  console.log(`   Egresos (Abonos si tarjeta):  S/ ${entityEgresos[ent].toFixed(2)}`);
  console.log(`   Neto / Saldo:                 S/ ${entityBalances[ent].toFixed(2)}`);
});
