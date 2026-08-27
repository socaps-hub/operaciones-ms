export type MetaMesNumero = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface MetaColocacionSucursalExcel {
  sucursalNombre: string;
  metas: Record<MetaMesNumero, number>;
  totalAnual: number;
}

export interface MetaColocacionExcelParsed {
  sucursales: MetaColocacionSucursalExcel[];

  totalCooperativa: {
    metas: Record<MetaMesNumero, number>;
    totalAnual: number;
  };
}

export interface MetaColocacionPersistencia {
  sucursalNumero: string;
  periodoMes: MetaMesNumero;
  meta: number;
}