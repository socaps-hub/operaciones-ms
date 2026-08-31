import { CreditoFortalezaResumenOutput } from './credito-fortaleza-resumen.output';
import { CreditoFortalezaEnfoque } from '../inputs/credito-fortaleza-colocacion.input';
import { CreditoFortalezaProductoOutput } from './credito-fortaleza-producto.output';
import { CreditoFortalezaGrupoOutput } from './credito-fortaleza-grupo.output';

export class CreditoFortalezaColocacionOutput {
  oficinaNombre: string;

  periodoMes: number;

  periodoAnio: number;

  enfoque: CreditoFortalezaEnfoque;

  totalColocacion: number;

  totalPrestamos: number;

  mayores: CreditoFortalezaProductoOutput[];

  menores: CreditoFortalezaProductoOutput[];

  totalMayores: CreditoFortalezaGrupoOutput;

  totalMenores: CreditoFortalezaGrupoOutput;

  resto: CreditoFortalezaGrupoOutput;

  resumenAcumulado: CreditoFortalezaResumenOutput;

  resumenMensual: CreditoFortalezaResumenOutput;
}
