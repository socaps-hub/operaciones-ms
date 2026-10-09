import { CaptacionPresupuestoResumenOutput } from './captacion-cumplimiento-presupuesto-resumen.output';
import { CaptacionPresupuestoMensualOutput } from './captacion-cumplimiento-presupuesto-mensual.output';
import { CaptacionPresupuestoComportamientoOutput } from './captacion-cumplimiento-presupuesto-comportamiento.output';

export class CaptacionCumplimientoPresupuestoOutput {
  resumen: CaptacionPresupuestoResumenOutput;

  mensual: CaptacionPresupuestoMensualOutput;

  comportamiento: CaptacionPresupuestoComportamientoOutput[];
}
