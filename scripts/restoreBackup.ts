/**
 * FINANZAS 2.0 - Script de Restauración Determinista de Respaldo
 * 
 * Uso:
 *   npx tsx scripts/restoreBackup.ts --verify-only
 *   npx tsx scripts/restoreBackup.ts --execute (Requiere confirmación explícita)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface BackupMetadata {
  backupTimestamp: string;
  remoteProject: string;
  table: string;
  totalRows: number;
  breakdown: {
    financialTransactions: number;
    configChunks: number;
    pendingPayments: number;
  };
  rows: any[];
}

export function loadAndVerifyBackup(backupFilePath: string, checksumFilePath?: string): BackupMetadata {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Archivo de respaldo no encontrado: ${backupFilePath}`);
  }

  const content = fs.readFileSync(backupFilePath, 'utf-8');

  if (checksumFilePath && fs.existsSync(checksumFilePath)) {
    const expectedChecksum = fs.readFileSync(checksumFilePath, 'utf-8').trim().split(/\s+/)[0];
    const actualChecksum = crypto.createHash('sha256').update(content).digest('hex');
    if (expectedChecksum !== actualChecksum) {
      throw new Error(`¡Fallo de integridad en el respaldo! Checksum esperado: ${expectedChecksum}, actual: ${actualChecksum}`);
    }
  }

  const parsed: BackupMetadata = JSON.parse(content);
  if (!parsed.rows || !Array.isArray(parsed.rows) || parsed.rows.length !== parsed.totalRows) {
    throw new Error('La estructura interna del respaldo está corrupta o incompleta.');
  }

  return parsed;
}

export function validateRecordSchema(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  if (!row.id || typeof row.id !== 'string') return false;
  // Campos esperados en transacciones financieras
  if (!row.id.startsWith('config-') && !row.id.startsWith('pending-')) {
    if (!row.Fecha || !row.Tipo || typeof row.Monto !== 'number') {
      return false;
    }
  }
  return true;
}

export function prepareRestorationBatches(rows: any[], batchSize = 100): any[][] {
  const batches: any[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  return batches;
}
