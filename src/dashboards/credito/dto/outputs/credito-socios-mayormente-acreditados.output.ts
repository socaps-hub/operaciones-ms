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

export class CreditoSocioAcreditadoDetalleOutput {
  credito: string;

  desembolso: number;

  sucursalNumero: string;
  sucursalNombre: string;

  tipo: string;
  formaPago: string;
  producto: string;

  fechaEntrega: string;
  fechaVencimiento: string;

  capitalVigente: number;
  capitalVencido: number;

  saldo: number;

  diasMora: number;
  tasa: number;
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

  /*
   * Los 20 socios ordenados por
   * crédito otorgado.
   */
  socios: CreditoSocioMayormenteAcreditadoOutput[];

  /*
   * CAG actualmente consultado.
   *
   * Si el input no envía CAG,
   * será el primer socio del ranking.
   */
  cagSeleccionado: string | null;

  totalDesembolsoSeleccionado: number;
  totalSaldoSeleccionado: number;

  /*
   * Créditos individuales del CAG.
   */
  creditos: CreditoSocioAcreditadoDetalleOutput[];

  /*
   * Distribución de RA01CEntregada
   * correspondiente EXCLUSIVAMENTE
   * a los créditos de los Top 20 CAG.
   */
  distribucionSucursales: CreditoSociosAcreditadosSucursalOutput[];

  /*
   * SUM(RA01CEntregada) de los
   * créditos pertenecientes al Top 20.
   */
  totalCreditoOtorgado: number;

  /*
   * Número total de créditos que
   * pertenecen a los Top 20 CAG.
   */
  totalPrestamos: number;
}
