export class CreditoProductividadRankingMensualItemOutput {
  lugar: number;

  usuario: string;

  ejecutivo: string;

  monto: number;

  numeroPrestamos: number;
}

export class CreditoProductividadRankingMensualOutput {
  total: number;

  page: number;

  pageSize: number;

  items: CreditoProductividadRankingMensualItemOutput[];
}
