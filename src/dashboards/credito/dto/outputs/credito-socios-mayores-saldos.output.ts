export class CreditoSocioMayorSaldoOutput {
  cag: string;

  nombreSocio: string;

  sucursales: string[];

  saldo: number;

  numeroPrestamos: number;
}

export class CreditoSociosMayoresSaldosSucursalOutput {
  sucursalNumero: string;

  sucursalNombre: string;

  monto: number;

  porcentaje: number;
}

export class CreditoSocioMayorSaldoDetalleOutput {
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

export class CreditoSociosMayoresSaldosOutput {
  periodoMes: number;
  periodoAnio: number;

  socios: CreditoSocioMayorSaldoOutput[];

  cagSeleccionado: string | null;

  totalDesembolsoSeleccionado: number;
  totalSaldoSeleccionado: number;

  creditos: CreditoSocioMayorSaldoDetalleOutput[];

  distribucionSucursales: CreditoSociosMayoresSaldosSucursalOutput[];

  totalSaldo: number;

  totalPrestamos: number;
}
