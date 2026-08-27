import { SetMetadata } from '@nestjs/common';
import { AuditActionEnum } from '../enums/audit-action.enum';
import { AuditSourceEnum } from '../enums/audit-source.enum';

export const ACTIVITY_LOG_KEY = 'activity-log';

export interface ActivityLogEntityMeta {
  name: string;
  idPath: string;
}

export interface ActivityLogMetadata {
  service: string;      // supervision-ms
  module: string;       // solicitudes
  action: AuditActionEnum;
  source?: AuditSourceEnum;
  eventName?: string;
  operationName?: string;

  entities: ActivityLogEntityMeta[];
}


export const ActivityLog = (meta: ActivityLogMetadata) =>
  SetMetadata(ACTIVITY_LOG_KEY, meta);

