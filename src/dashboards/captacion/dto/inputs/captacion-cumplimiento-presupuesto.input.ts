import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { CaptacionPresupuestoAnalisisEnum } from '../../enums/captacion-cumplimiento-presupuesto-analisis.enum';

export class CaptacionCumplimientoPresupuestoInput {
  @IsUUID()
  cooperativaId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodoMes: number;

  @IsInt()
  periodoAnio: number;

  @IsOptional()
  @IsString()
  oficina?: string;

  @IsEnum(CaptacionPresupuestoAnalisisEnum)
  analisis: CaptacionPresupuestoAnalisisEnum;
}
