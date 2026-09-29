export class CreditoSocioDetalleCreditoOutput {
  credito: string;

  desembolso: number;

  sucursalNumero: string;
  sucursalNombre: string;

  tipo: string;
  formaPago: string;
  producto: string;

  fechaEntrega: string;
  fechaVencimiento: string;

  capitalVigente: number;
  capitalVencido: number;

  saldo: number;

  diasMora: number;
  tasa: number;
}

export class CreditoSocioDetalleOutput {
  cag: string;

  totalDesembolso: number;
  totalSaldo: number;

  creditos: CreditoSocioDetalleCreditoOutput[];
}
