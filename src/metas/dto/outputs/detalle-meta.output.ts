import { DetalleMetaSucursalOutput } from './detalle-meta-sucursal.output';
import { DetalleMetaTotalesOutput } from './detalle-meta-totales.output';
import { OpMetaAreaEnum } from '../../../common/enums/op-meta-area.enum';

export class DetalleMetaOutput {
  controlId: number;
  cooperativaId: string;
  cooperativaNombre: string;
  area: OpMetaAreaEnum;
  periodoAnio: number;

  filas: DetalleMetaSucursalOutput[];
  totales: DetalleMetaTotalesOutput;
}
