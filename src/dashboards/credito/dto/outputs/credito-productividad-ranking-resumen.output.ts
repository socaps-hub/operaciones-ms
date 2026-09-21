export class CreditoProductividadProduccionProductoOutput {
  producto: string;

  tipo: string;

  monto: number;

  numeroPrestamos: number;
}
export class CreditoProductividadProduccionMesOutput {
  totalMonto: number;
  totalPrestamos: number;
  productos: CreditoProductividadProduccionProductoOutput[];
}

export class CreditoProductividadRankingMensualResumenOutput {
  lugar: number;
  totalEjecutivos: number;
  usuario: string;
  ejecutivo: string;
  monto: number;
  numeroPrestamos: number;
}

export class CreditoProductividadRankingSucursalOutput {
  sucursalNumero: string;
  sucursalNombre: string;
  monto: number;
}

export class CreditoProductividadRankingAcumuladoResumenOutput {
  lugar: number;
  totalEjecutivos: number;
  usuario: string;
  ejecutivo: string;
  total: number;
  sucursales: CreditoProductividadRankingSucursalOutput[];
}

export class CreditoProductividadRankingResumenOutput {
  produccionMes: CreditoProductividadProduccionMesOutput;

  rankingMensual: CreditoProductividadRankingMensualResumenOutput;

  rankingAcumulado: CreditoProductividadRankingAcumuladoResumenOutput;
}
