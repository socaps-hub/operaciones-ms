import { CreditoProductividadRankingSucursalOutput } from './credito-productividad-ranking-resumen.output';

export class CreditoProductividadRankingAcumuladoItemOutput {
  lugar: number;

  usuario: string;

  ejecutivo: string;

  total: number;

  sucursales: CreditoProductividadRankingSucursalOutput[];
}

export class CreditoProductividadRankingAcumuladoOutput {
  total: number;

  page: number;

  pageSize: number;

  items: CreditoProductividadRankingAcumuladoItemOutput[];
}
