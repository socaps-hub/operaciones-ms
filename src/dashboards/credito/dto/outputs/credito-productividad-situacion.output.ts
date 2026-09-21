export class CreditoProductividadSituacionItemOutput {
  categoria: string;

  colocacionAcumulada: number;

  numeroPrestamos: number;

  porcentaje: number;

  saldo: number;
}

export class CreditoProductividadSituacionGrupoOutput {
  totalColocacionAcumulada: number;

  totalSaldo: number;

  items: CreditoProductividadSituacionItemOutput[];
}

export class CreditoProductividadSituacionOutput {
  totalColocacionAcumulada: number;

  totalSaldo: number;

  carteraVigente: CreditoProductividadSituacionGrupoOutput;

  carteraVencida: CreditoProductividadSituacionGrupoOutput;
}