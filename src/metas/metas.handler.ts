import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MetasService } from './metas.service';
import { GetControlesMetasInput } from './dto/inputs/get-controles-metas.input';
import { GetDetalleMetaInput } from './dto/inputs/get-detalle-meta.input';

@Controller()
export class MetasHandler {
  constructor(private readonly _service: MetasService) {}

  @MessagePattern('operaciones.metas.getControles')
  public handleGetControlesMetas(@Payload() input: GetControlesMetasInput) {
    return this._service.getControlesMetas(input);
  }

  @MessagePattern('operaciones.metas.getDetalle')
  public handleGetDetalleMeta(@Payload() input: GetDetalleMetaInput) {
    return this._service.getDetalleMeta(input);
  }
}
