import { registerEnumType } from '@nestjs/graphql';

export enum OpMetaAreaEnum {
  CREDITO = 'CREDITO',
  CAPTACION = 'CAPTACION',
  AFILIACION = 'AFILIACION',
}

// Registros para GraphQL
registerEnumType(OpMetaAreaEnum, { name: 'OpMetaAreaEnum' });
