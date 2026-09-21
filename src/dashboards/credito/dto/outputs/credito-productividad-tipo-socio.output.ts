import {
  CreditoProductividadDistribucionPeriodoOutput,
  CreditoProductividadDistribucionSaldoOutput,
} from './credito-productividad-distribucion.output';

export class CreditoProductividadTipoSocioOutput {
  delMes: CreditoProductividadDistribucionPeriodoOutput;

  delAnio: CreditoProductividadDistribucionPeriodoOutput;

  acumulado: CreditoProductividadDistribucionPeriodoOutput;

  saldo: CreditoProductividadDistribucionSaldoOutput;
}
