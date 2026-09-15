import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { UsuariosAliasService } from './usuarios-alias.service';
import { UsuarioAliasOutput } from './dto/outputs/usuario-alias.output';
import { CreateUsuarioAliasInput } from './dto/inputs/create-usuario-alias.input';
import {GetUsuariosAliasInput} from "./dto/inputs/get-usuarios-alias.input";
import {UpdateUsuarioAliasInput} from "./dto/inputs/update-usuario-alias.input";
import {DeleteUsuarioAliasInput} from "./dto/inputs/delete-usuario-alias.input";
import {DeleteUsuarioAliasOutput} from "./dto/outputs/delete-usuario-alias.output";
import { GetUsuariosLogicosCandidatosInput } from './dto/inputs/get-usuarios-logicos-candidatos.input';
import { UsuarioLogicoCandidatoOutput } from './dto/outputs/usuario-logico-candidato.output';
import { ActivityLogRpcInterceptor } from '../../common/interceptor/activity-log-rpc.interceptor';
import { ActivityLog } from '../../common/decorators/activity-log.decorator';
import { AuditActionEnum } from '../../common/enums/audit-action.enum';

@Controller()
export class UsuariosAliasHandler {
  constructor(private readonly _service: UsuariosAliasService) {}

  @UseInterceptors(ActivityLogRpcInterceptor)
  @ActivityLog({
    service: 'operaciones-ms',
    module: 'usuarios-alias',
    action: AuditActionEnum.CREATE,
    eventName: 'operaciones.usuarios-alias.createAlias',
    entities: [{ name: 'OP02UsuarioAlias', idPath: 'OP02Id' }],
  })
  @MessagePattern('operaciones.usuarios-alias.createAlias')
  public async createAlias(
    @Payload() input: CreateUsuarioAliasInput,
  ): Promise<UsuarioAliasOutput> {
    return this._service.createAlias(input);
  }

  @MessagePattern('operaciones.usuarios-alias.getAliases')
  public async getAliases(
    @Payload() input: GetUsuariosAliasInput,
  ): Promise<UsuarioAliasOutput[]> {
    return this._service.getAliases(input.cooperativaId);
  }

  @UseInterceptors(ActivityLogRpcInterceptor)
  @ActivityLog({
    service: 'operaciones-ms',
    module: 'usuarios-alias',
    action: AuditActionEnum.UPDATE,
    eventName: 'operaciones.usuarios-alias.updateAlias',
    entities: [{ name: 'OP02UsuarioAlias', idPath: 'OP02Id' }],
  })
  @MessagePattern('operaciones.usuarios-alias.updateAlias')
  public async updateAlias(
    @Payload() input: UpdateUsuarioAliasInput,
  ): Promise<UsuarioAliasOutput> {
    return this._service.updateAlias(input);
  }

  @UseInterceptors(ActivityLogRpcInterceptor)
  @ActivityLog({
    service: 'operaciones-ms',
    module: 'usuarios-alias',
    action: AuditActionEnum.DELETE,
    eventName: 'operaciones.usuarios-alias.deleteAlias',
    entities: [{ name: 'OP02UsuarioAlias', idPath: 'OP02Id' }],
  })
  @MessagePattern('operaciones.usuarios-alias.deleteAlias')
  public async deleteAlias(
    @Payload() input: DeleteUsuarioAliasInput,
  ): Promise<DeleteUsuarioAliasOutput> {
    return this._service.deleteAlias(input);
  }

  @MessagePattern('operaciones.usuarios-alias.getUsuariosLogicosCandidatos')
  public async getUsuariosLogicosCandidatos(
    @Payload() input: GetUsuariosLogicosCandidatosInput,
  ): Promise<UsuarioLogicoCandidatoOutput[]> {
    return this._service.getUsuariosLogicosCandidatos(input);
  }
}