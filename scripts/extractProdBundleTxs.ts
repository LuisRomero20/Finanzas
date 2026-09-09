import https from 'https';
import fs from 'fs';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

async function main() {
  const js = await fetchUrl('https://finanzas-tau-three.vercel.app/assets/index-CAJbylCw.js');
  fs.writeFileSync('scripts/prodBundle.js', js, 'utf-8');
  console.log('Saved bundle, size:', js.length);

  // Search for transactions in bundle
  const match = js.match(/masterTransactions\s*=\s*(\[[^\]]+\])/);
  console.log('Found masterTransactions?', !!match);

  // Or let's search for "Interbank" and see how transactions are defined
  const txMatches = js.match(/\{id:"[^"]+",Tipo:"[^"]+",Fecha:"[^"]+",Categoria:"[^"]+",Concepto:"[^"]+",Monto:[0-9.]+,Entidad:"[^"]+",Mes:"[^"]+"[^\}]*\}/g);
  console.log('Regex tx count:', txMatches ? txMatches.length : 0);

  if (txMatches) {
    const seti = txMatches.map(s => {
      try {
        // Fix JSON keys
        const jsonStr = s.replace(/([a-zA-Z0-9_]+):/g, '"$1":');
        return JSON.parse(jsonStr);
      } catch (e) {
        return null;
      }
    }).filter(Boolean).filter(t => t.Mes === 'Setiembre');
    console.log('Setiembre transactions in bundle:', seti.length);

    const entityList = ['Interbank', 'BCP', 'BBVA Bfree', 'Interbank Amex', 'Ripley'];
    entityList.forEach(ent => {
      const ing = seti.filter(t => t.Entidad === ent && t.Tipo === 'Ingreso').reduce((a,b)=>a+b.Monto, 0);
      const egr = seti.filter(t => t.Entidad === ent && t.Tipo === 'Egreso').reduce((a,b)=>a+b.Monto, 0);
      console.log(`[${ent}] Ing: ${ing.toFixed(2)} | Egr: ${egr.toFixed(2)} | Saldo/Neto: ${(ing - egr).toFixed(2)}`);
    });
  }
}

main().catch(console.error);
