import {
  CreditoRentabilidadIdentificador,
  CreditoRentabilidadModo,
} from '../../enums/credito-rentabilidad.enum';

export class CreditoRentabilidadItemOutput {
  codigo: string | null;

  nombre: string;

  categoria: string | null;

  saldoCapital: number;

  totalSaldo: number;

  numeroPrestamos: number;

  porcentajeSaldo: number;

  interesNormalCobrado: number;

  interesMoratorioCobrado: number;

  totalInteresCobrado: number;

  porcentajeInteres: number;
}

export class CreditoRentabilidadResumenOutput {
  saldoCapital: number;

  totalSaldo: number;

  numeroPrestamos: number;

  interesNormalCobrado: number;

  interesMoratorioCobrado: number;

  totalInteresCobrado: number;
}

export class CreditoRentabilidadGraficaItemOutput {
  codigo: string | null;

  nombre: string;

  categoria: string | null;

  valor: number;
}

export class CreditoRentabilidadOutput {
  modo: CreditoRentabilidadModo;

  oficinaNumero: string | null;

  oficinaNombre: string;

  periodoMes: number;

  periodoAnio: number;

  identificador: CreditoRentabilidadIdentificador;

  total: number;

  page: number;

  pageSize: number;

  totalPages: number;

  totales: CreditoRentabilidadResumenOutput;

  items: CreditoRentabilidadItemOutput[];

  grafica: CreditoRentabilidadGraficaItemOutput[];

  top5: CreditoRentabilidadItemOutput[];
}
