export class CreditoComportamientoProductoMesOutput {
  periodoMes: number;

  colocacion: number | null;

  disponible: boolean;
}

export class CreditoComportamientoProductoExtremoOutput {
  periodoMes: number;

  colocacion: number;
}

export class CreditoComportamientoProductoOutput {
  oficinaNumero: string | null;

  oficinaNombre: string;

  productoNombre: string;

  periodoMes: number;

  periodoAnio: number;

  meses: CreditoComportamientoProductoMesOutput[];

  masAlto: CreditoComportamientoProductoExtremoOutput | null;

  masBajo: CreditoComportamientoProductoExtremoOutput | null;
}
