import type { SaveStatementResult, StatementSyncOutcomeLike } from '../../store/cardStatementStore';

export type SaveFeedbackTone = 'success' | 'warning' | 'error';

export interface SaveFeedback {
  tone: SaveFeedbackTone;
  message: string;
  /** true solo cuando Supabase confirmó la persistencia (NO implica verificación bancaria). */
  remoteConfirmed: boolean;
  /** El modal solo debe cerrarse cuando la información quedó al menos guardada localmente. */
  canClose: boolean;
}

/**
 * Traduce el resultado de guardar una conciliación a un mensaje veraz.
 * `bankStatusText` describe la verificación bancaria y se mantiene separado del estado de la nube.
 */
export function describeStatementSave(
  result: SaveStatementResult & { sync?: StatementSyncOutcomeLike },
  ctx: { cardName: string; amountText: string; bankStatusText: string },
): SaveFeedback {
  const bank = `Verificación bancaria: ${ctx.bankStatusText}.`;
  const head = `Conciliación de ${ctx.cardName} · saldo ${ctx.amountText}.`;

  if (!result.localSaved) {
    return {
      tone: 'error',
      remoteConfirmed: false,
      canClose: false,
      message: `❌ No se guardó: el dispositivo no pudo conservar los datos (${result.error ?? 'error de almacenamiento'}). Intenta de nuevo.`,
    };
  }

  switch (result.sync?.state) {
    case 'remote_confirmed':
      return { tone: 'success', remoteConfirmed: true, canClose: true, message: `✅ ${head} Confirmada en Supabase. ${bank}` };
    case 'conflict':
      return {
        tone: 'warning', remoteConfirmed: false, canClose: true,
        message: `⚠️ ${head} Versiones distintas entre dispositivos: tu versión sigue en este dispositivo y NO se sobrescribió la de la nube. Revisa Ajustes › Sincronización. ${bank}`,
      };
    case 'sync_failed':
      return {
        tone: 'warning', remoteConfirmed: false, canClose: true,
        message: `⚠️ ${head} Guardada en este dispositivo, pero Supabase no la confirmó: ${result.sync.message} Puedes reintentar. ${bank}`,
      };
    case 'local_pending':
    default:
      return {
        tone: 'warning', remoteConfirmed: false, canClose: true,
        message: `💾 ${head} Guardada en este dispositivo; pendiente de confirmar en Supabase${result.sync ? ` (${result.sync.message})` : ''}. ${bank}`,
      };
  }
}
