export class CreditoProductividadColocacionOutput {
  monto: number;

  numeroPrestamos: number;
}

export class CreditoProductividadParticipacionOficinaOutput {
  saldoSeleccionado: number;

  porcentajeSeleccionado: number;

  saldoResto: number;

  porcentajeResto: number;
}

export class CreditoProductividadOficinaOutput {
  acumulado: CreditoProductividadColocacionOutput;

  delAnio: CreditoProductividadColocacionOutput;

  delMes: CreditoProductividadColocacionOutput;

  saldo: number;

  participacion: CreditoProductividadParticipacionOficinaOutput;
}
