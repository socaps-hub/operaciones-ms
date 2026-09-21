import {
  CreditoProductividadDistribucionPeriodoOutput,
  CreditoProductividadDistribucionSaldoOutput,
} from './credito-productividad-distribucion.output';

export class CreditoProductividadClasificacionOutput {
  delMes: CreditoProductividadDistribucionPeriodoOutput;

  delAnio: CreditoProductividadDistribucionPeriodoOutput;

  acumulado: CreditoProductividadDistribucionPeriodoOutput;

  saldo: CreditoProductividadDistribucionSaldoOutput;
}