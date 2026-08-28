import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CreditoService } from './credito.service';
import { CreditoColocacionTotalInput } from './dto/inputs/credito-colocacion-total.input';
import { CreditoMedicionAnualInput } from './dto/inputs/credito-medicion-anual.input';

@Controller()
export class CreditoHandler {
  constructor(private readonly _service: CreditoService) {}

  @MessagePattern('operaciones.credito.getColocacionTotalDashboard')
  public handleGetColocacionTotalDashboard(
    @Payload('input') input: CreditoColocacionTotalInput,
  ) {
    return this._service.getColocacionTotalDashboard(input);
  }

  @MessagePattern('operaciones.credito.getMedicionAnual')
  public getMedicionAnual( @Payload() input: CreditoMedicionAnualInput ) {
    return this._service.getMedicionAnual(input);
  }
}