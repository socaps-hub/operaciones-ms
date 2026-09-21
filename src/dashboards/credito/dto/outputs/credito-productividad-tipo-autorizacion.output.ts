import {
  CreditoProductividadDistribucionPeriodoOutput,
  CreditoProductividadDistribucionSaldoOutput,
} from './credito-productividad-distribucion.output';

export class CreditoProductividadTipoAutorizacionOutput {
  delMes: CreditoProductividadDistribucionPeriodoOutput;

  delAnio: CreditoProductividadDistribucionPeriodoOutput;

  acumulado: CreditoProductividadDistribucionPeriodoOutput;

  saldo: CreditoProductividadDistribucionSaldoOutput;
}
