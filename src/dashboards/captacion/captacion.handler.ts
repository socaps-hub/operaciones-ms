import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CaptacionService } from './captacion.service';
import { CaptacionPeriodoInput } from './dto/inputs/captacion-periodo.input';
import { CaptacionBaseInput } from './dto/inputs/captacion-base.input';
import { CaptacionProductoInput } from './dto/inputs/captacion-producto.input';
import { CaptacionCumplimientoPresupuestoInput } from './dto/inputs/captacion-cumplimiento-presupuesto.input';

@Controller()
export class CaptacionHandler {
  constructor(private readonly _captacionService: CaptacionService) {}

  //   ===============================================
  //   SALDOS
  //   ===============================================
  @MessagePattern('operaciones.captacion.getTablaSaldos')
  public getTablaSaldos(@Payload() input: CaptacionPeriodoInput) {
    return this._captacionService.getTablaSaldos(input);
  }

  @MessagePattern('operaciones.captacion.getPosicion')
  public getPosicion(@Payload() input: CaptacionBaseInput) {
    return this._captacionService.getPosicion(input);
  }

  @MessagePattern('operaciones.captacion.getComposicion')
  public getComposicion(@Payload() input: CaptacionBaseInput) {
    return this._captacionService.getComposicion(input);
  }

  @MessagePattern('operaciones.captacion.getCuentasVista')
  public getCuentasVista(@Payload() input: CaptacionProductoInput) {
    return this._captacionService.getCuentasVista(input);
  }

  @MessagePattern('operaciones.captacion.getCuentasPlazo')
  public getCuentasPlazo(@Payload() input: CaptacionProductoInput) {
    return this._captacionService.getCuentasPlazo(input);
  }

  //   ===============================================
  //   CUMPPLIMIENTO - METAS
  //   ===============================================
  @MessagePattern('operaciones.captacion.cumplimientoPresupuesto')
  public getCumplimientoPresupuesto(
    @Payload() input: CaptacionCumplimientoPresupuestoInput,
  ) {
    return this._captacionService.getCumplimientoPresupuesto(input);
  }
}
