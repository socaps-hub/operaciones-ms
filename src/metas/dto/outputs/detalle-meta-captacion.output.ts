import { OpMetaAreaEnum } from '../../../common/enums/op-meta-area.enum';

export class DetalleMetaCaptacionMontosOutput {
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

export class DetalleMetaCaptacionSucursalOutput {
  sucursalNumero: string | null;
  sucursalNombre: string;

  vista: DetalleMetaCaptacionMontosOutput;
  plazo: DetalleMetaCaptacionMontosOutput;
  infantil: DetalleMetaCaptacionMontosOutput;
}

export class DetalleMetaCaptacionOutput {
  controlId: number;
  cooperativaId: string;
  cooperativaNombre: string;
  area: OpMetaAreaEnum;
  periodoAnio: number;

  filas: DetalleMetaCaptacionSucursalOutput[];
}