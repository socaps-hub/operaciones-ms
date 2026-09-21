export class CreditoProductividadCalidadCarteraOutput {
  saldoVigente: number;
  porcentajeVigente: number;

  saldoVencido: number;
  porcentajeVencido: number;
}

export class CreditoProductividadParticipacionEjecutivoOutput {
  saldoEjecutivo: number;
  porcentajeEjecutivo: number;

  saldoResto: number;
  porcentajeResto: number;
}

export class CreditoProductividadGraficasEjecutivoOutput {
  calidadCartera: CreditoProductividadCalidadCarteraOutput;

  participacionSaldo: CreditoProductividadParticipacionEjecutivoOutput;
}
