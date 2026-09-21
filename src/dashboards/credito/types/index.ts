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

export type TraspasosCarteraVencidaDetalleRow = {
  numeroCredito: string;
  categoria: string;
  producto: string;
  fechaEntrega: string;
  cantidadEntregada: number;
  saldoTotal: string | number | bigint | Prisma.Decimal | null;
  fechaCambioSituacion: string;
};

export type CountRow = {
  total: bigint;
};

export type RentabilidadTotalesRow = {
  saldoCapital: string | number | bigint | Prisma.Decimal | null;

  totalSaldo: string | number | bigint | Prisma.Decimal | null;

  numeroPrestamos: bigint;

  interesNormalCobrado: string | number | bigint | Prisma.Decimal | null;

  interesMoratorioCobrado: string | number | bigint | Prisma.Decimal | null;

  totalInteresCobrado: string | number | bigint | Prisma.Decimal | null;
};

export type RentabilidadItemRow = {
  codigo: string | null;
  nombre: string;
  categoria: string | null;

  saldoCapital: string | number | bigint | Prisma.Decimal | null;

  totalSaldo: string | number | bigint | Prisma.Decimal | null;

  numeroPrestamos: bigint;

  interesNormalCobrado: string | number | bigint | Prisma.Decimal | null;

  interesMoratorioCobrado: string | number | bigint | Prisma.Decimal | null;

  totalInteresCobrado: string | number | bigint | Prisma.Decimal | null;
};

export type RentabilidadCountRow = {
  total: bigint;
};

export type RentabilidadGraficaRow = {
  codigo: string | null;
  nombre: string;
  categoria: string | null;

  valor: string | number | bigint | Prisma.Decimal | null;
};

export type ProductividadEjecutivoRow = {
  codigo: string;
  nombre: string;
};

export type ProductividadColocacionRow = {
  monto: string | number | bigint | Prisma.Decimal | null;
  numeroPrestamos: string | number | bigint | Prisma.Decimal | null;
};

export type ProductividadSaldoRow = {
  saldo: string | number | bigint | Prisma.Decimal | null;
};

export type ProductividadEjecutivoColocacionRow = {
  montoEjecutivo: string | number | bigint | Prisma.Decimal | null;

  numeroPrestamos: string | number | bigint | Prisma.Decimal | null;

  montoBase: string | number | bigint | Prisma.Decimal | null;
};

export type ProductividadGraficasEjecutivoRow = {
  saldoEjecutivo: string | number | bigint | Prisma.Decimal | null;

  saldoVigente: string | number | bigint | Prisma.Decimal | null;

  saldoVencido: string | number | bigint | Prisma.Decimal | null;

  saldoBase: string | number | bigint | Prisma.Decimal | null;
};

export type ProductividadDistribucionColocacionRow = {
  categoria: string | null;
  monto: string | number | bigint | Prisma.Decimal | null;
  numeroPrestamos: string | number | bigint | Prisma.Decimal | null;
};

export type ProductividadDistribucionSaldoRow = {
  categoria: string | null;
  saldo: string | number | bigint | Prisma.Decimal | null;
};
