export class CreditoMayorSaldoOutput {
  credito: string;

  cag: string;

  nombreSocio: string;

  sucursal: string;

  tipo: string;

  formaPago: string;

  numeroAmortizaciones: string;

  plazoDias: number;

  periodicidadDias: number;

  categoria: string;

  fechaEntrega: string;

  fechaVencimiento: string;

  cantidadEntregada: number;

  capitalVencido: number;

  capitalCobrado: number;

  capitalCarteraVigente: number;

  capitalCarteraVencida: number;

  interesNormal: number;

  interesMoratorio: number;

  interesNormalCarteraVencida: number;

  interesMoratorioCarteraVencida: number;

  saldo: number;
}

export class CreditoMayorSaldoSucursalOutput {
  sucursalNumero: string;

  sucursalNombre: string;

  monto: number;

  porcentaje: number;
}

export class CreditoMayoresSaldosOutput {
  periodoMes: number;
  periodoAnio: number;

  total: number;
  totalSaldo: number;

  totalCantidadEntregada: number;
  totalCapitalVencido: number;
  totalCapitalCobrado: number;
  totalCapitalCarteraVigente: number;
  totalCapitalCarteraVencida: number;
  totalInteresNormal: number;
  totalInteresMoratorio: number;
  totalInteresNormalCarteraVencida: number;
  totalInteresMoratorioCarteraVencida: number;

  items: CreditoMayorSaldoOutput[];

  distribucionSucursales: CreditoMayorSaldoSucursalOutput[];
}