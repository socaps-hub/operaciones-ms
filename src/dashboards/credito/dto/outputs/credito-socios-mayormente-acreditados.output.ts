export class CreditoSocioMayormenteAcreditadoOutput {
  cag: string;
  nombreSocio: string;

  /*
   * Un socio puede tener créditos
   * en más de una sucursal.
   */
  sucursales: string[];

  totalCreditoOtorgado: number;
  numeroPrestamos: number;
}

export class CreditoSociosAcreditadosSucursalOutput {
  sucursalNumero: string;
  sucursalNombre: string;

  monto: number;
  porcentaje: number;
}

export class CreditoSociosMayormenteAcreditadosOutput {
  periodoMes: number;
  periodoAnio: number;

  socios: CreditoSocioMayormenteAcreditadoOutput[];

  distribucionSucursales: CreditoSociosAcreditadosSucursalOutput[];

  totalCreditoOtorgado: number;
  totalPrestamos: number;
}
