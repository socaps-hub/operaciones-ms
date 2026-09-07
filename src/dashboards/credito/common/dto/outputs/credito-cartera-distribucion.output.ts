export class CreditoCarteraDistribucionRangoOutput {
  rango: string;

  desde: number;

  hasta: number | null;

  monto: number;

  carteraBanda: number;

  numeroPrestamos: number;

  porcentaje: number;
}

export class CreditoCarteraDistribucionOutput {
  oficinaNumero: string | null;

  oficinaNombre: string;

  productoId: string | null;

  productoNombre: string;

  productoCategoria: string | null;

  periodoMes: number;

  periodoAnio: number;

  totalCartera: number;

  numeroPrestamos: number;
}
