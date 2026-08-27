import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UploadMetasColocacionInput } from './dto/inputs/upload-metas-colocacion.input';
import { MetasService } from './metas.service';
import { ActivityLogRpcInterceptor } from '../../../common/interceptor/activity-log-rpc.interceptor';
import { ActivityLog } from '../../../common/decorators/activity-log.decorator';
import { AuditActionEnum } from '../../../common/enums/audit-action.enum';
import { AuditSourceEnum } from '../../../common/enums/audit-source.enum';

@Controller()
export class MetasHandler {
  constructor(private readonly _service: MetasService) {}

  @UseInterceptors(ActivityLogRpcInterceptor)
  @ActivityLog({
    service: 'operaciones-ms',
    module: 'dashboards/credito/metas',
    action: AuditActionEnum.UPLOAD,
    source: AuditSourceEnum.JOB,
    eventName: 'operaciones.credito.metas.upload',
    entities: [],
  })
  @MessagePattern('operaciones.credito.metas.upload')
  public handleUploadMetasColocacion(
    @Payload() input: UploadMetasColocacionInput,
  ) {
    return this._service.uploadMetasColocacion(input);
  }
}