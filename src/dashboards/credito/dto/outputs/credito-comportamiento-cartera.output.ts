export class CreditoComportamientoCarteraMesOutput {
  periodoMes: number;

  saldo: number | null;

  disponible: boolean;
}

export class CreditoComportamientoCarteraResumenOutput {
  saldo: number;

  numeroPrestamos: number;

  participacionOficinaPorcentaje: number;

  vigente: number;

  prestamosVigentes: number;

  vigentePorcentaje: number;

  vencida: number;

  prestamosVencidos: number;

  vencidaPorcentaje: number;
}

export class CreditoComportamientoCarteraOutput {
  oficinaNumero: string | null;

  oficinaNombre: string;

  productoId: string | null;

  productoNombre: string;

  productoCategoria: string | null;

  periodoMes: number;

  periodoAnio: number;

  saldoPromedio: number;

  resumen: CreditoComportamientoCarteraResumenOutput;

  meses: CreditoComportamientoCarteraMesOutput[];
}
