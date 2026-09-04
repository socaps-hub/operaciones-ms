export class CreditoDiasAtrasoRangoOutput {
  rango: string;

  desde: number;

  hasta: number | null;

  monto: number;

  numeroPrestamos: number;

  porcentaje: number;
}

export class CreditoDiasAtrasoOutput {
  oficinaNumero: string | null;

  oficinaNombre: string;

  productoId: string | null;

  productoNombre: string;

  productoCategoria: string | null;

  periodoMes: number;

  periodoAnio: number;

  totalCartera: number;

  numeroPrestamos: number;

  rangos: CreditoDiasAtrasoRangoOutput[];
}
