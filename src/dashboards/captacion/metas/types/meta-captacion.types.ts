export type MetaCaptacionMesNumero =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

export interface MetaCaptacionMensualExcel {
  mes: MetaCaptacionMesNumero;
  vista: number;
  plazo: number;
  infantil: number;
  total: number;
}

export interface MetaCaptacionSucursalExcel {
  sucursalNombre: string;
  metas: MetaCaptacionMensualExcel[];

  totalAnual: {
    vista: number;
    plazo: number;
    infantil: number;
    total: number;
  };
}

export interface MetaCaptacionPersistencia {
  sucursalNumero: string | null;
  periodoMes: MetaCaptacionMesNumero;

  metaVista: number;
  metaPlazo: number;
  metaInfantil: number;
}