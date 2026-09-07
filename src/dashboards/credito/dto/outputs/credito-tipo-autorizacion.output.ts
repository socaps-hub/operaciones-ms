export class CreditoTipoAutorizacionDistribucionOutput {
  tipo: string;

  monto: number;

  numeroPrestamos: number;

  porcentaje: number;
}

export class CreditoTipoAutorizacionSegmentoOutput {
  totalCartera: number;

  numeroPrestamos: number;

  distribucion: CreditoTipoAutorizacionDistribucionOutput[];
}

export class CreditoTipoAutorizacionOutput {
  oficinaNumero: string | null;

  oficinaNombre: string;

  productoId: string | null;

  productoNombre: string | null;

  productoCategoria: string | null;

  periodoMes: number;

  periodoAnio: number;

  oficina: CreditoTipoAutorizacionSegmentoOutput;

  producto: CreditoTipoAutorizacionSegmentoOutput | null;
}
