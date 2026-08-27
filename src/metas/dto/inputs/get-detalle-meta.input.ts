import { IsInt, Min } from 'class-validator';

export class GetDetalleMetaInput {
  @IsInt()
  @Min(1)
  controlId: number;
}
