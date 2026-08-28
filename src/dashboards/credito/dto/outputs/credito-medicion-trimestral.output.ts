import { CreditoMedicionTrimestralMesOutput } from './credito-medicion-trimestral-mes.output';

export class CreditoMedicionTrimestralOutput {
  oficinaNombre: string;

  periodoMes: number;
  periodoAnio: number;

  numeroTrimestre: number;

  mesInicioTrimestre: number;
  mesFinTrimestre: number;

  capitalColocadoTrimestre: number;

  meses: CreditoMedicionTrimestralMesOutput[];
}
