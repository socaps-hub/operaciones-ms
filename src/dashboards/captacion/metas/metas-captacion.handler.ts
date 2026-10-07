import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ActivityLog } from '../../../common/decorators/activity-log.decorator';

import { MetasCaptacionService } from './metas-captacion.service';
import { UploadMetasCaptacionInput } from './dto/inputs/upload-metas-captacion.input';
import { UploadMetasCaptacionOutput } from './dto/outputs/upload-metas-captacion.output';
import { ActivityLogRpcInterceptor } from '../../../common/interceptor/activity-log-rpc.interceptor';
import { AuditActionEnum } from '../../../common/enums/audit-action.enum';
import { AuditSourceEnum } from '../../../common/enums/audit-source.enum';

@Controller()
@UseInterceptors(ActivityLogRpcInterceptor)
export class MetasCaptacionHandler {
  constructor(private readonly _metasCaptacionService: MetasCaptacionService) {}

  @UseInterceptors(ActivityLogRpcInterceptor)
  @ActivityLog({
    service: 'operaciones-ms',
    module: 'dashboards/captacion/metas',
    action: AuditActionEnum.UPLOAD,
    source: AuditSourceEnum.JOB,
    eventName: 'operaciones.captacion.metas.upload',
    entities: [],
  })
  @MessagePattern('operaciones.captacion.metas.upload')
  public uploadMetasCaptacion(
    @Payload()
    input: UploadMetasCaptacionInput,
  ): Promise<UploadMetasCaptacionOutput> {
    return this._metasCaptacionService.uploadMetasCaptacion(input);
  }
}
