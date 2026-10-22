import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const integrationEnabled = process.env.RUN_SUPABASE_INTEGRATION === 'true';

describe.runIf(integrationEnabled)('Supabase Backup & Restoration Procedure Verification', () => {
  it('verifies integrity and validates restore readiness from local verified backup', async () => {
    const backupDir = path.resolve(process.cwd(), 'backups');
    const fullBackupPath = path.join(backupDir, 'supabase_backup_20261022_full.json');
    const checksumPath = path.join(backupDir, 'supabase_backup_20261022_full.sha256');

    expect(fs.existsSync(fullBackupPath)).toBe(true);
    expect(fs.existsSync(checksumPath)).toBe(true);

    const expectedChecksum = fs.readFileSync(checksumPath, 'utf-8').trim().split(/\s+/)[0];
    const actualChecksum = crypto.createHash('sha256').update(fs.readFileSync(fullBackupPath)).digest('hex');
    expect(actualChecksum).toBe(expectedChecksum);

    const readBack = JSON.parse(fs.readFileSync(fullBackupPath, 'utf-8'));
    expect(readBack.totalRows).toBe(2246);
    expect(readBack.rows.length).toBe(2246);
    expect(readBack.breakdown.financialTransactions).toBe(903);
    expect(readBack.breakdown.configChunks).toBe(1343);
  }, 60_000);
});
