import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MetasAfiliacionService } from './metas-afiliacion.service';
import { UploadMetasAfiliacionInput } from './dto/inputs/upload-metas-afiliacion.input';
import { ActivityLogRpcInterceptor } from '../../../common/interceptor/activity-log-rpc.interceptor';
import { ActivityLog } from '../../../common/decorators/activity-log.decorator';
import { AuditActionEnum } from '../../../common/enums/audit-action.enum';
import { AuditSourceEnum } from '../../../common/enums/audit-source.enum';

@Controller()
export class MetasAfiliacionHandler {
  constructor(private readonly _service: MetasAfiliacionService) {}

  @UseInterceptors(ActivityLogRpcInterceptor)
  @ActivityLog({
    service: 'operaciones-ms',
    module: 'dashboards/afiliacion/metas',
    action: AuditActionEnum.UPLOAD,
    source: AuditSourceEnum.JOB,
    eventName: 'operaciones.afiliacion.metas.upload',
    entities: [],
  })
  @MessagePattern('operaciones.afiliacion.metas.upload')
  public handleUploadMetasAfiliacion(
    @Payload() input: UploadMetasAfiliacionInput,
  ) {
    return this._service.uploadMetasAfiliacion(input);
  }
}
