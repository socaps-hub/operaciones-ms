import { Prisma } from '@prisma/client';

export type CaptacionNumericValue =
  | Prisma.Decimal
  | number
  | bigint
  | string
  | null;

export type CaptacionTablaSaldoRow = {
  oficinaNumero: string;
  oficinaNombre: string | null;
  mes: number;
  saldo: CaptacionNumericValue;
};

export type CaptacionPosicionTemporalRow = {
  anio: number;
  mes: number;
  saldo: CaptacionNumericValue;
};

export type CaptacionPosicionClasificacionRow = {
  clasificacion: string | null;
  saldo: CaptacionNumericValue;
  numeroCuentas: bigint | number | string;
};

export type CaptacionPosicionSucursalRow = {
  oficinaNumero: string;
  oficinaNombre: string | null;
  saldo: CaptacionNumericValue;
};

export type CaptacionOficinaSeleccionada = {
  numero: string;
  nombre: string;
};

export type CaptacionComposicionDetalleRow = {
  clasificacion: string | null;
  saldo: CaptacionNumericValue;
  numeroCuentas: bigint | number | string;
};

export type CaptacionComposicionComportamientoRow = {
  clasificacion: string | null;
  mes: number;
  saldo: CaptacionNumericValue;
};

export type CaptacionProductoDistribucionRow = {
  producto: string | null;
  saldo: CaptacionNumericValue;
  numeroCuentas: bigint | number | string;
};

export type CaptacionCuentasVistaTotalRow = {
  saldoCaptacion: CaptacionNumericValue;
};

export type CaptacionProductoComportamientoRow = {
  mes: number;
  saldo: CaptacionNumericValue;
};

export type CaptacionTotalRow = {
  saldoCaptacion: CaptacionNumericValue;
};

export type CaptacionProductosAnalisisTipo = 'VISTA' | 'PLAZO';

export type CaptacionProductosAnalisisConfig = {
  clasificaciones: readonly string[];
  categoriaCatalogo: string;
};