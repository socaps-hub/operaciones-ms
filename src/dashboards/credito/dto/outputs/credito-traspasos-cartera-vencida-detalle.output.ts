export class CreditoTraspasosCarteraVencidaDetalleItemOutput {
  numeroCredito: string;
  categoria: string;
  producto: string;
  fechaEntrega: string;
  cantidadEntregada: number;
  saldoTotal: number;
  fechaCambioSituacion: string;
}

export class CreditoTraspasosCarteraVencidaDetalleOutput {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  items: CreditoTraspasosCarteraVencidaDetalleItemOutput[];
}
