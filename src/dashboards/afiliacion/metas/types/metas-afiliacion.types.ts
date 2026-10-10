export type MetaAfiliacionMesNumero =
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

export interface MetaAfiliacionValores {
  metas: Record<MetaAfiliacionMesNumero, number>;
  totalAnual: number;
}

export interface MetaAfiliacionSucursalExcel extends MetaAfiliacionValores {
  sucursalNombre: string;
}

export interface MetaAfiliacionHojaParsed {
  sucursales: MetaAfiliacionSucursalExcel[];
  totalCooperativa: MetaAfiliacionValores;
}

export interface MetasAfiliacionExcelParsed {
  integral: MetaAfiliacionHojaParsed;
  ahorradorMenor: MetaAfiliacionHojaParsed;
}
