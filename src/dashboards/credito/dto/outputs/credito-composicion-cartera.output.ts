export class CreditoComposicionCarteraProductoOutput {
  productoNombre: string;

  productoCategoria: string;

  saldo: number;

  vigente: number;

  vencida: number;

  vigentePorcentaje: number;

  vencidaPorcentaje: number;

  numeroPrestamos: number;

  prestamosVigentes: number;

  prestamosVencidos: number;
}

export class CreditoComposicionCarteraOutput {
  oficinaNumero: string | null;

  oficinaNombre: string;

  periodoMes: number;

  periodoAnio: number;

  productos: CreditoComposicionCarteraProductoOutput[];
}
