import { OpMetaAreaEnum } from '../../../common/enums/op-meta-area.enum';

export class ControlMetaOutput {
  controlId: number;
  cooperativaId: string;
  cooperativaNombre: string;
  area: OpMetaAreaEnum;
  periodoAnio: number;
  archivo: string | null;

  // Fecha y hora de la carga en formato ISO.
  fechaCarga: string;

  sucursales: number;
  metasRegistradas: number;
}
