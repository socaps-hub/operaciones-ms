export class CreditoCumplimientoMensualColocacionMesOutput {
  periodoMes: number;

  meta: number;

  colocacion: number | null;

  disponible: boolean;
}

export class CreditoCumplimientoMensualColocacionOutput {
  oficinaNumero: string | null;

  oficinaNombre: string;

  periodoMes: number;

  periodoAnio: number;

  meses: CreditoCumplimientoMensualColocacionMesOutput[];
}