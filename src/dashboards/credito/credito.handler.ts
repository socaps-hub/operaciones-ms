import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CreditoService } from './credito.service';
import { CreditoColocacionTotalInput } from './dto/inputs/credito-colocacion-total.input';
import { CreditoMedicionAnualInput } from './dto/inputs/credito-medicion-anual.input';
import { CreditoMedicionMensualInput } from './dto/inputs/credito-medicion-mensual.input';
import { CreditoMedicionTrimestralInput } from './dto/inputs/credito-medicion-trimestral.input';
import { CreditoFortalezaColocacionInput } from './dto/inputs/credito-fortaleza-colocacion.input';

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
  public getMedicionAnual(@Payload() input: CreditoMedicionAnualInput) {
    return this._service.getMedicionAnual(input);
  }

  @MessagePattern('operaciones.credito.getMedicionMensual')
  public getMedicionMensual(@Payload() input: CreditoMedicionMensualInput) {
    return this._service.getMedicionMensual(input);
  }

  @MessagePattern('operaciones.credito.getMedicionTrimestral')
  public getMedicionTrimestral(
    @Payload() input: CreditoMedicionTrimestralInput,
  ) {
    return this._service.getMedicionTrimestral(input);
  }

  @MessagePattern('operaciones.credito.getFortalezaColocacion')
  public getFortalezaColocacion(
    @Payload() input: CreditoFortalezaColocacionInput,
  ) {
    return this._service.getFortalezaColocacion(input);
  }
}