import { toMinorUnits, fromMinorUnits } from './money';

export type FinancialEventKind =
  | 'income'
  | 'cash_expense'
  | 'card_purchase'
  | 'card_payment'
  | 'interest'
  | 'fee'
  | 'refund'
  | 'transfer'
  | 'adjustment';

export interface FinancialImpact {
  /**
   * Impacto económico en el estado de resultados / presupuesto mensual.
   * Positivo = Ingreso económico.
   * Negativo = Gasto / Pérdida económica consumida.
   * Cero = Operación patrimonial sin impacto en resultados (ej. pago de tarjeta, transferencia).
   */
  economicImpact: number;

  /**
   * Impacto de tesorería / flujo de caja líquido (bancos, efectivo).
   * Positivo = Entrada de efectivo.
   * Negativo = Salida de efectivo de una cuenta bancaria o billetera.
   * Cero = No mueve dinero líquido inmediatamente (ej. compra a crédito con tarjeta).
   */
  cashImpact: number;

  /**
   * Impacto en la deuda / pasivo financiero exigible.
   * Positivo = Incremento de deuda por pagar (ej. compra con tarjeta de crédito).
   * Negativo = Cancelación o amortización de deuda (ej. abono o pago a tarjeta de crédito).
   * Cero = No genera ni reduce deuda financiera.
   */
  liabilityImpact: number;
}

export interface ClassifiedTransaction {
  id: string;
  kind: FinancialEventKind;
  date: string; // YYYY-MM-DD
  concept: string;
  category: string;
  entity: string;
  amount: number;
  currency: 'PEN' | 'USD';
  impact: FinancialImpact;
  isCreditCardTransaction: boolean;
  isInstallmentPurchase?: boolean;
  installmentsCount?: number;
  explanation: string;
}

/**
 * Determina el tipo de evento y calcula el triple impacto contable (económico, caja, pasivo).
 * Esto garantiza que el gasto de una compra con tarjeta se compute exactamente una sola vez,
 * y que el pago posterior de la tarjeta sea reconocido como amortización de pasivo y salida
 * de caja, NUNCA como un segundo gasto.
 */
export function evaluateTransactionImpact(
  tipo: string,
  concepto: string,
  categoria: string,
  entidad: string,
  monto: number,
  esTarjeta: boolean,
  cuotas?: number,
): { kind: FinancialEventKind; impact: FinancialImpact; explanation: string } {
  const normTipo = (tipo || '').trim().toLowerCase();
  const normConcepto = (concepto || '').trim().toLowerCase();
  const normCategoria = (categoria || '').trim().toLowerCase();

  const absMonto = Math.abs(monto);
  const minor = toMinorUnits(absMonto);

  // 1. Ingreso
  if (normTipo === 'ingreso') {
    return {
      kind: 'income',
      impact: {
        economicImpact: fromMinorUnits(minor),
        cashImpact: fromMinorUnits(minor),
        liabilityImpact: 0,
      },
      explanation: 'Ingreso confirmado: incrementa tesorería y patrimonio neto.',
    };
  }

  // 2. Detección de pago de tarjeta de crédito
  const isCardPayment =
    normCategoria.includes('pago tarjeta') ||
    normConcepto.includes('pago tarjeta') ||
    normConcepto.includes('pago tc') ||
    normConcepto.includes('abono tarjeta') ||
    normConcepto.includes('cancelacion tarjeta') ||
    normConcepto.includes('liquidacion tarjeta') ||
    normTipo === 'pago tarjeta';

  if (isCardPayment) {
    return {
      kind: 'card_payment',
      impact: {
        economicImpact: 0, // ¡CRÍTICO: No es un nuevo gasto! El gasto ya fue reconocido en las compras.
        cashImpact: fromMinorUnits(-minor), // Sale dinero de la cuenta corriente/ahorros
        liabilityImpact: fromMinorUnits(-minor), // Reduce la deuda de la tarjeta de crédito
      },
      explanation:
        'Pago de tarjeta de crédito: amortiza el pasivo y disminuye caja; no duplica el gasto en el presupuesto.',
    };
  }

  // 3. Intereses bancarios / financiamiento
  if (normCategoria.includes('interes') || normConcepto.includes('interés') || normConcepto.includes('interes')) {
    return {
      kind: 'interest',
      impact: {
        economicImpact: fromMinorUnits(-minor),
        cashImpact: esTarjeta ? 0 : fromMinorUnits(-minor),
        liabilityImpact: esTarjeta ? fromMinorUnits(minor) : 0,
      },
      explanation: 'Interés financiero: gasto económico que incrementa la deuda facturada de la tarjeta.',
    };
  }

  // 4. Comisiones / Seguro de desgravamen
  if (
    normCategoria.includes('comision') ||
    normConcepto.includes('comisión') ||
    normConcepto.includes('comision') ||
    normConcepto.includes('desgravamen') ||
    normConcepto.includes('membresia') ||
    normConcepto.includes('membresía')
  ) {
    return {
      kind: 'fee',
      impact: {
        economicImpact: fromMinorUnits(-minor),
        cashImpact: esTarjeta ? 0 : fromMinorUnits(-minor),
        liabilityImpact: esTarjeta ? fromMinorUnits(minor) : 0,
      },
      explanation: 'Comisión/Seguro bancario: gasto económico que se añade a la obligación de la tarjeta.',
    };
  }

  // 5. Devolución / Reembolso
  if (normConcepto.includes('devolución') || normConcepto.includes('devolucion') || normConcepto.includes('reembolso')) {
    return {
      kind: 'refund',
      impact: {
        economicImpact: fromMinorUnits(minor),
        cashImpact: esTarjeta ? 0 : fromMinorUnits(minor),
        liabilityImpact: esTarjeta ? fromMinorUnits(-minor) : 0,
      },
      explanation: 'Devolución de compra: extingue el pasivo y neutraliza el gasto previo.',
    };
  }

  // 6. Transferencia entre cuentas propias
  if (normTipo === 'transferencia' || normCategoria.includes('transferencia')) {
    return {
      kind: 'transfer',
      impact: {
        economicImpact: 0,
        cashImpact: 0, // Movimiento neto cero dentro del patrimonio líquido
        liabilityImpact: 0,
      },
      explanation: 'Transferencia interna: movimiento de liquidez sin cambio de patrimonio ni resultados.',
    };
  }

  // 7. Compra con Tarjeta de Crédito
  if (esTarjeta) {
    const isInstallments = typeof cuotas === 'number' && cuotas > 1;
    return {
      kind: 'card_purchase',
      impact: {
        economicImpact: fromMinorUnits(-minor), // Se devenga el consumo en el presupuesto del ciclo
        cashImpact: 0, // No sale efectivo bancario hoy
        liabilityImpact: fromMinorUnits(minor), // Nace una obligación financiera (deuda) con el banco emisor
      },
      explanation: isInstallments
        ? `Compra en ${cuotas} cuotas con tarjeta: genera pasivo financiero amortizable mes a mes.`
        : 'Consumo con tarjeta de crédito: devenga gasto y crea obligación financiera por pagar al corte.',
    };
  }

  // 8. Gasto directo en efectivo / débito
  return {
    kind: 'cash_expense',
    impact: {
      economicImpact: fromMinorUnits(-minor),
      cashImpact: fromMinorUnits(-minor),
      liabilityImpact: 0,
    },
    explanation: 'Gasto directo en efectivo/débito: devenga gasto y disminuye tesorería inmediatamente.',
  };
}

/**
 * Agrega los impactos contables de una lista de transacciones.
 */
export function aggregateImpacts(impacts: readonly FinancialImpact[]): FinancialImpact {
  let economicMinor = 0;
  let cashMinor = 0;
  let liabilityMinor = 0;

  for (const item of impacts) {
    economicMinor += toMinorUnits(item.economicImpact);
    cashMinor += toMinorUnits(item.cashImpact);
    liabilityMinor += toMinorUnits(item.liabilityImpact);
  }

  return {
    economicImpact: fromMinorUnits(economicMinor),
    cashImpact: fromMinorUnits(cashMinor),
    liabilityImpact: fromMinorUnits(liabilityMinor),
  };
}
