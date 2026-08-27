import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { OpMetaAreaEnum } from '../../../common/enums/op-meta-area.enum';

export class GetControlesMetasInput {
  @IsOptional()
  @IsUUID()
  cooperativaId?: string;

  @IsOptional()
  @IsEnum(OpMetaAreaEnum)
  area?: OpMetaAreaEnum;

  @IsOptional()
  @IsInt()
  @Min(2000)
  periodoAnio?: number;
}
