import { IsInt, IsUUID, Min, IsString, IsNotEmpty } from 'class-validator';

export class UploadMetasAfiliacionInput {
  @IsUUID()
  cooperativaId: string;

  @IsInt()
  @Min(2000)
  periodoAnio: number;

  @IsString()
  @IsNotEmpty()
  s3Key: string;
}
