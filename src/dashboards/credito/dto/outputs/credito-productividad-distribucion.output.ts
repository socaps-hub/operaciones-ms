export class CreditoProductividadDistribucionItemOutput {
  categoria: string;
  monto: number;
  numeroPrestamos: number;
  porcentaje: number;
}

export class CreditoProductividadDistribucionPeriodoOutput {
  total: number;
  items: CreditoProductividadDistribucionItemOutput[];
}

export class CreditoProductividadDistribucionSaldoItemOutput {
  categoria: string;
  saldo: number;
  porcentaje: number;
}

export class CreditoProductividadDistribucionSaldoOutput {
  total: number;
  items: CreditoProductividadDistribucionSaldoItemOutput[];
}
