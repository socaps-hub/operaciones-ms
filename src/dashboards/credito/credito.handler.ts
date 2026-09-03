import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CreditoService } from './credito.service';
import { CreditoColocacionTotalInput } from './dto/inputs/credito-colocacion-total.input';
import { CreditoMedicionAnualInput } from './dto/inputs/credito-medicion-anual.input';
import { CreditoMedicionMensualInput } from './dto/inputs/credito-medicion-mensual.input';
import { CreditoMedicionTrimestralInput } from './dto/inputs/credito-medicion-trimestral.input';
import { CreditoFortalezaColocacionInput } from './dto/inputs/credito-fortaleza-colocacion.input';
import { CreditoPosicionLogroMetaOutput } from './dto/outputs/credito-posicion-logro-meta.output';
import { CreditoPosicionLogroMetaInput } from './dto/inputs/credito-posicion-logro-meta.input';
import { CreditoCumplimientoMensualColocacionInput } from './dto/inputs/credito-cumplimiento-mensual-colocacion.input';
import {
  CreditoCumplimientoMensualColocacionOutput
} from './dto/outputs/credito-cumplimiento-mensual-colocacion.output';
import { CreditoComportamientoProductoInput } from './dto/inputs/credito-comportamiento-producto.input';
import { CreditoComportamientoProductoOutput } from './dto/outputs/credito-comportamiento-producto.output';
import { CreditoComportamientoCarteraInput } from './dto/inputs/credito-comportamiento-cartera.input';
import { CreditoComportamientoCarteraOutput } from './dto/outputs/credito-comportamiento-cartera.output';

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

  @MessagePattern('operaciones.credito.getPosicionLogroMeta')
  public async getPosicionLogroMeta(
    @Payload()
    input: CreditoPosicionLogroMetaInput,
  ): Promise<CreditoPosicionLogroMetaOutput> {
    return this._service.getPosicionLogroMeta(input);
  }

  @MessagePattern('operaciones.credito.getCumplimientoMensualColocacion')
  public async getCumplimientoMensualColocacion(
    @Payload()
    input: CreditoCumplimientoMensualColocacionInput,
  ): Promise<CreditoCumplimientoMensualColocacionOutput> {
    return this._service.getCumplimientoMensualColocacion(input);
  }

  @MessagePattern('operaciones.credito.getComportamientoProducto')
  public async getComportamientoProducto(
    @Payload()
    input: CreditoComportamientoProductoInput,
  ): Promise<CreditoComportamientoProductoOutput> {
    return this._service.getComportamientoProducto(input);
  }

  @MessagePattern('operaciones.credito.getComportamientoCartera')
  public async getComportamientoCartera(
    @Payload() input: CreditoComportamientoCarteraInput,
  ): Promise<CreditoComportamientoCarteraOutput> {
    return this._service.getComportamientoCartera(input);
  }
}