import { OpMetaAreaEnum } from '../../../common/enums/op-meta-area.enum';

export class DetalleMetaAfiliacionMontosOutput {
  enero: number;
  febrero: number;
  marzo: number;
  abril: number;
  mayo: number;
  junio: number;
  julio: number;
  agosto: number;
  septiembre: number;
  octubre: number;
  noviembre: number;
  diciembre: number;
  total: number;
}

export class DetalleMetaAfiliacionSucursalOutput extends DetalleMetaAfiliacionMontosOutput {
  sucursalNumero: string;
  sucursalNombre: string;
}

export class DetalleMetaAfiliacionCategoriaOutput {
  filas: DetalleMetaAfiliacionSucursalOutput[];
  totales: DetalleMetaAfiliacionMontosOutput;
}

export class DetalleMetaAfiliacionOutput {
  controlId: number;
  cooperativaId: string;
  cooperativaNombre: string;
  area: OpMetaAreaEnum;
  periodoAnio: number;
  integral: DetalleMetaAfiliacionCategoriaOutput;
  ahorradorMenor: DetalleMetaAfiliacionCategoriaOutput;
}
