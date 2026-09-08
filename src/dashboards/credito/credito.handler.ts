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
import { CreditoComposicionCarteraInput } from './dto/inputs/credito-composicion-cartera.input';
import { CreditoComposicionCarteraOutput } from './dto/outputs/credito-composicion-cartera.output';
import { CreditoDiasAtrasoInput } from './dto/inputs/credito-dias-atraso.input';
import { CreditoDiasAtrasoOutput } from './dto/outputs/credito-dias-atraso.output';
import { CreditoAmortizacionesPactadasInput } from './dto/inputs/credito-amortizaciones-pactadas.input';
import { CreditoAmortizacionesPactadasOutput } from './dto/outputs/credito-amortizaciones-pactadas.output';
import { CreditoAmortizacionesVencidasInput } from './dto/inputs/credito-amortizaciones-vencidas.input';
import { CreditoAmortizacionesVencidasOutput } from './dto/outputs/credito-amortizaciones-vencidas.output';
import { CreditoTipoAutorizacionInput } from './dto/inputs/credito-tipo-autorizacion.input';
import { CreditoTipoAutorizacionOutput } from './dto/outputs/credito-tipo-autorizacion.output';
import { CreditoSituacionLegalInput } from './dto/inputs/credito-situacion-legal.input';
import { CreditoSituacionLegalOutput } from './dto/outputs/credito-situacion-legal.output';
import { CreditoTraspasosCarteraVencidaInput } from './dto/inputs/credito-traspasos-cartera-vencida.input';
import { CreditoTraspasosCarteraVencidaOutput } from './dto/outputs/credito-traspasos-cartera-vencida.output';

@Controller()
export class CreditoHandler {
  constructor(private readonly _service: CreditoService) {}

  @MessagePattern('operaciones.credito.getColocacionTotalDashboard')
  public handleGetColocacionTotalDashboard(
    @Payload('input') input: CreditoColocacionTotalInput,
  ) {
    return this._service.getColocacionTotalDashboard(input);
  }

  // ===================================
  // CUMPLIMIENTO-METAS
  // ===================================
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

  // ===================================
  // CALIDAD DE LA CARTERA
  // ===================================
  @MessagePattern('operaciones.credito.getComportamientoCartera')
  public async getComportamientoCartera(
    @Payload() input: CreditoComportamientoCarteraInput,
  ): Promise<CreditoComportamientoCarteraOutput> {
    return this._service.getComportamientoCartera(input);
  }

  @MessagePattern('operaciones.credito.getComposicionCartera')
  public async getComposicionCartera(
    @Payload()
    input: CreditoComposicionCarteraInput,
  ): Promise<CreditoComposicionCarteraOutput> {
    return this._service.getComposicionCartera(input);
  }

  @MessagePattern('operaciones.credito.getDiasAtraso')
  public async getDiasAtraso(
    @Payload()
    input: CreditoDiasAtrasoInput,
  ): Promise<CreditoDiasAtrasoOutput> {
    return this._service.getDiasAtraso(input);
  }

  @MessagePattern('operaciones.credito.getAmortizacionesPactadas')
  public async getAmortizacionesPactadas(
    @Payload()
    input: CreditoAmortizacionesPactadasInput,
  ): Promise<CreditoAmortizacionesPactadasOutput> {
    return this._service.getAmortizacionesPactadas(input);
  }

  @MessagePattern('operaciones.credito.getAmortizacionesVencidas')
  public async getAmortizacionesVencidas(
    @Payload()
    input: CreditoAmortizacionesVencidasInput,
  ): Promise<CreditoAmortizacionesVencidasOutput> {
    return this._service.getAmortizacionesVencidas(input);
  }

  @MessagePattern('operaciones.credito.getTipoAutorizacion')
  public async getTipoAutorizacion(
    @Payload() input: CreditoTipoAutorizacionInput,
  ): Promise<CreditoTipoAutorizacionOutput> {
    return this._service.getTipoAutorizacion(input);
  }

  @MessagePattern('operaciones.credito.getSituacionLegal')
  public async getSituacionLegal(
    @Payload() input: CreditoSituacionLegalInput,
  ): Promise<CreditoSituacionLegalOutput> {
    return this._service.getSituacionLegal(input);
  }

  @MessagePattern('operaciones.credito.getTraspasosCarteraVencida')
  public async getTraspasosCarteraVencida(
    @Payload() input: CreditoTraspasosCarteraVencidaInput,
  ): Promise<CreditoTraspasosCarteraVencidaOutput> {
    return this._service.getTraspasosCarteraVencida(input);
  }
}