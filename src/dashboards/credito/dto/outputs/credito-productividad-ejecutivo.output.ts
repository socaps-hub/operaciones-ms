export class CreditoProductividadEjecutivoColocacionOutput {
  monto: number;

  numeroPrestamos: number;

  porcentaje: number;
}

export class CreditoProductividadEjecutivoOutput {
  delMes: CreditoProductividadEjecutivoColocacionOutput;

  delAnio: CreditoProductividadEjecutivoColocacionOutput;

  acumulado: CreditoProductividadEjecutivoColocacionOutput;

  saldo: number;
}