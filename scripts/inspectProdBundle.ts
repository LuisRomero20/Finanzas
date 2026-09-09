import https from 'https';

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
  const html = await fetchUrl('https://finanzas-tau-three.vercel.app');
  console.log('Prod HTML received, length:', html.length);
  const matches = html.match(/\/assets\/[a-zA-Z0-9_\-\.]+\.js/g);
  console.log('Script matches:', matches);

  if (matches) {
    for (const p of matches) {
      const fullUrl = `https://finanzas-tau-three.vercel.app${p}`;
      const js = await fetchUrl(fullUrl);
      console.log(`Fetched ${p} (${js.length} bytes)`);

      // Search for Supabase URL in bundle
      const sbMatch = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/g);
      if (sbMatch) {
        console.log(`   --> Found Supabase URLs in ${p}:`, sbMatch);
      }

      // Check for transactions
      if (js.includes('2452.63') || js.includes('2214.91') || js.includes('488.43')) {
        console.log(`   --> MATCH FOUND in ${p}!`);
      }
    }
  }
}

main().catch(console.error);
