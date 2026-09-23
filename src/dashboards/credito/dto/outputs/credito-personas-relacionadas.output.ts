export class CreditoPersonaRelacionadaCategoriaOutput {
  codigo: string;

  tipoRelacion: string;

  numeroPrestamos: number;

  entrega: number;

  porcentajeEntrega: number;

  saldo: number;

  porcentajeSaldo: number;
}

export class CreditoPersonasRelacionadasResumenOutput {
  totalPrestamos: number;

  totalEntrega: number;

  totalSaldo: number;

  categorias: CreditoPersonaRelacionadaCategoriaOutput[];
}

export class CreditoPersonaRelacionadaOutput {
  prestamo: string;

  cag: string;

  socio: string;

  sucursalNumero: string;

  sucursalNombre: string;

  entrega: number;

  saldo: number;

  categoria: string;

  clasificacion: string;

  tipoRelacion: string;

  fechaEntrega: string;

  fechaVencimiento: string;

  plazo: number;

  abonos: string;

  situacion: string;

  tasaOrdinaria: number;

  capitalVigente: number;

  capitalVencido: number;
}

export class CreditoPersonasRelacionadasCreditosOutput {
  total: number;

  page: number;

  pageSize: number;

  totalPages: number;

  items: CreditoPersonaRelacionadaOutput[];
}