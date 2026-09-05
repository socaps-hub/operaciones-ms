export class CreditoAmortizacionesPactadasRangoOutput {
  rango: string;
  desde: number;
  hasta: number | null;

  monto: number;

  carteraBanda: number;

  numeroPrestamos: number;
  porcentaje: number;
}

export class CreditoAmortizacionesPactadasOutput {
  oficinaNumero: string | null;
  oficinaNombre: string;

  productoId: string | null;
  productoNombre: string;
  productoCategoria: string | null;

  periodoMes: number;
  periodoAnio: number;

  totalCartera: number;
  numeroPrestamos: number;

  rangos: CreditoAmortizacionesPactadasRangoOutput[];
}
