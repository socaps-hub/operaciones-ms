import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { OpMetaAreaEnum } from '../../../../../common/enums/op-meta-area.enum';

export class UploadMetasColocacionInput {
  @IsUUID()
  cooperativaId: string;

  @IsInt()
  @Min(2000)
  periodoAnio: number;

  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @IsEnum(OpMetaAreaEnum)
  area: OpMetaAreaEnum;
}
