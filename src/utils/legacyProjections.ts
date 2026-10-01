/** Two historical writers used 0/1/... and 000/001/... under the same prefix.
 * The padded format is the later writer. Never concatenate the two documents.
 */
export function decodeLegacyProjections(rows: Array<{ id: string; concepto: string }>): unknown {
  const padded = rows.filter(row => /^config-proj-chunk-\d{3}$/.test(row.id));
  const selected = padded.length ? padded : rows.filter(row => /^config-proj-chunk-\d+$/.test(row.id));
  const sorted = [...selected].sort((a, b) => Number(a.id.split('-').pop()) - Number(b.id.split('-').pop()));
  if (!sorted.length || sorted.some((row, index) => Number(row.id.split('-').pop()) !== index)) throw new SyntaxError('Faltan fragmentos de la copia antigua');
  return JSON.parse(sorted.map(row => row.concepto).join(''));
}
