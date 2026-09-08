import { Prisma } from '@prisma/client';
import { CreditoFortalezaProductoOutput } from '../dto/outputs/credito-fortaleza-producto.output';
import { CreditoFortalezaGrupoOutput } from '../dto/outputs/credito-fortaleza-grupo.output';

export type FortalezaProductoRow = {
  productoNombre: string;
  colocacion: number;
  prestamos: number;
};

export type FortalezaResultado = {
  totalColocacion: number;
  totalPrestamos: number;

  mayores: CreditoFortalezaProductoOutput[];
  menores: CreditoFortalezaProductoOutput[];

  totalMayores: CreditoFortalezaGrupoOutput;
  totalMenores: CreditoFortalezaGrupoOutput;
  resto: CreditoFortalezaGrupoOutput;
};

export type SituacionLegalKey =
  | 'VIGENTE_SIN_PAGOS_VENCIDOS'
  | 'VIGENTE_CON_PAGOS_VENCIDOS'
  | 'VENCIDA_ADMINISTRATIVA'
  | 'EN_LITIGIO';

export type SituacionLegalRow = {
  situacion: SituacionLegalKey;
  monto: string | number | bigint | Prisma.Decimal | null;
  numeroPrestamos: bigint;
};

export type SituacionLegalSegmento = {
  monto: number;
  numeroPrestamos: number;
};

export type CarteraAggregateRow = {
  monto: string | number | bigint | Prisma.Decimal | null;

  numeroPrestamos: bigint;
};

export type CarteraAggregate = {
  monto: number;
  numeroPrestamos: number;
};

export type TraspasosCarteraMensualRow = {
  periodoMes: number;

  carteraVencida: string | number | bigint | Prisma.Decimal | null;

  carteraTotalSucursal: string | number | bigint | Prisma.Decimal | null;
};

export type TraspasosCarteraMesResult = {
  periodoMes: number;
  carteraVencida: number | null;
  indiceMorosidad: number | null;
  disponible: boolean;
};

