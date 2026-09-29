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

export class CreditoSociosMayoresSaldosOutput {
  periodoMes: number;
  periodoAnio: number;

  socios: CreditoSocioMayorSaldoOutput[];

  distribucionSucursales: CreditoSociosMayoresSaldosSucursalOutput[];

  totalSaldo: number;
  totalPrestamos: number;
}
