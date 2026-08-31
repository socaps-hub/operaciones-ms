export class CreditoPosicionLogroMetaOficinaOutput {
  oficinaNumero: string;

  oficinaNombre: string;

  metaMensual: number;

  colocacionReal: number;

  cumplimientoPorcentaje: number;

  cumplioMeta: boolean;
}

export class CreditoPosicionLogroMetaOutput {
  periodoMes: number;

  periodoAnio: number;

  oficinas: CreditoPosicionLogroMetaOficinaOutput[];
}