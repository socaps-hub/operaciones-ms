import { AuditActionEnum } from "../enums/audit-action.enum";
import { AuditResultEnum } from "../enums/audit-result.enum";
import { AuditSourceEnum } from "../enums/audit-source.enum";

export interface ActivityLogEvent {
  service: string;          // supervision-ms
  module: string;           // credito
  action: AuditActionEnum;
  source?: AuditSourceEnum;
  result?: AuditResultEnum;
  eventName?: string;

  entity: string;
  entityId?: string;

  user?: {
    id?: string;
    nombre?: string;
    rol?: string;
  };

  org?: {
    cooperativaId?: string;
    sucursalId?: string;
  };

  before?: Record<string, any>;
  after?: Record<string, any>;

  meta?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
    correlationId?: string;
  };

  message?: string;
  error?: string;
}
