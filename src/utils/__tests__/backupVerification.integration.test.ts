import { describe, expect, it } from 'vitest';
import { supabase } from '../../lib/supabase';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const integrationEnabled = process.env.RUN_SUPABASE_INTEGRATION === 'true';

describe.runIf(integrationEnabled)('Supabase Backup & Restoration Procedure Verification', () => {
  it('extracts all 2,246 records across pagination, verifies integrity and validates restore readiness', async () => {
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 1. Get exact remote count
    const { count: remoteTotal, error: countErr } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true });

    expect(countErr).toBeNull();
    expect(remoteTotal).toBe(2246);

    // 2. Paginate with range (PostgREST limits to 1000 per request)
    const pageSize = 1000;
    const allRows: any[] = [];
    let from = 0;

    while (from < (remoteTotal ?? 0)) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      if (data) {
        allRows.push(...data);
      }
      from += pageSize;
    }

    expect(allRows.length).toBe(2246);

    // 3. Classify records
    const configRows = allRows.filter((r) => typeof r.id === 'string' && r.id.startsWith('config-'));
    const pendingRows = allRows.filter((r) => typeof r.id === 'string' && r.id.startsWith('pending-'));
    const financialRows = allRows.filter(
      (r) => !r.id?.startsWith('config-') && !r.id?.startsWith('pending-'),
    );

    expect(configRows.length).toBe(1343);
    expect(pendingRows.length).toBe(0);
    expect(financialRows.length).toBe(903);

    // 4. Write full backup file
    const fullBackupPath = path.join(backupDir, 'supabase_backup_20261022_full.json');
    const financialBackupPath = path.join(backupDir, 'supabase_backup_20261022_financial_txs.json');
    const configBackupPath = path.join(backupDir, 'supabase_backup_20261022_config_chunks.json');

    const backupPayload = {
      backupTimestamp: new Date().toISOString(),
      remoteProject: 'njgzhjwfcxdxiibkuuqg',
      table: 'public.transacciones',
      totalRows: allRows.length,
      breakdown: {
        financialTransactions: financialRows.length,
        configChunks: configRows.length,
        pendingPayments: pendingRows.length,
      },
      rows: allRows,
    };

    fs.writeFileSync(fullBackupPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    fs.writeFileSync(financialBackupPath, JSON.stringify(financialRows, null, 2), 'utf-8');
    fs.writeFileSync(configBackupPath, JSON.stringify(configRows, null, 2), 'utf-8');

    // 5. Generate SHA-256 checksums
    const fullHash = crypto.createHash('sha256').update(fs.readFileSync(fullBackupPath)).digest('hex');
    const checksumPath = path.join(backupDir, 'supabase_backup_20261022_full.sha256');
    fs.writeFileSync(checksumPath, `${fullHash}  supabase_backup_20261022_full.json\n`, 'utf-8');

    console.log(`[Backup Verified] Full backup saved: ${fullBackupPath}`);
    console.log(`[Backup Verified] SHA-256 Checksum: ${fullHash}`);
    console.log(`[Backup Verified] Total verified records: ${allRows.length}`);

    // 6. Test Restoration Validation (parse and verify restore payload)
    const readBack = JSON.parse(fs.readFileSync(fullBackupPath, 'utf-8'));
    expect(readBack.totalRows).toBe(2246);
    expect(readBack.rows.length).toBe(2246);
    expect(readBack.breakdown.financialTransactions).toBe(903);
    expect(readBack.breakdown.configChunks).toBe(1343);
  }, 120_000);
});
