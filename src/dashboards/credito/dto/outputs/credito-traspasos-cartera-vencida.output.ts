export class CreditoTraspasosCarteraVencidaCardOutput {
  monto: number;
  numeroPrestamos: number;
  porcentaje: number | null;
}

export class CreditoTraspasosCarteraVencidaMesOutput {
  periodoMes: number;

  carteraVencida: number | null;

  indiceMorosidad: number | null;

  disponible: boolean;
}

export class CreditoTraspasosCarteraVencidaOutput {
  oficinaNumero: string | null;
  oficinaNombre: string;

  productoId: string | null;
  productoNombre: string | null;
  productoCategoria: string | null;

  periodoMes: number;
  periodoAnio: number;

  carteraVencidaCooperativa: CreditoTraspasosCarteraVencidaCardOutput;

  carteraVencidaSucursal: CreditoTraspasosCarteraVencidaCardOutput;

  carteraVencidaSegmento: CreditoTraspasosCarteraVencidaCardOutput;

  traspasosMesSucursal: CreditoTraspasosCarteraVencidaCardOutput;

  traspasosMesSegmento: CreditoTraspasosCarteraVencidaCardOutput;

  meses: CreditoTraspasosCarteraVencidaMesOutput[];
}