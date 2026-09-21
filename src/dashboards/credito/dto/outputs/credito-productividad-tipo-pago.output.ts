import {
  CreditoProductividadDistribucionPeriodoOutput,
  CreditoProductividadDistribucionSaldoOutput,
} from './credito-productividad-distribucion.output';

export class CreditoProductividadTipoPagoOutput {
  delMes: CreditoProductividadDistribucionPeriodoOutput;

  delAnio: CreditoProductividadDistribucionPeriodoOutput;

  acumulado: CreditoProductividadDistribucionPeriodoOutput;

  saldo: CreditoProductividadDistribucionSaldoOutput;
}
