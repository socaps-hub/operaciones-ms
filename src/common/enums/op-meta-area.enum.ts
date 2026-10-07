import { registerEnumType } from '@nestjs/graphql';

export enum OpMetaAreaEnum {
  CREDITO = 'CREDITO',
  CAPTACION = 'CAPTACION',
}

// Registros para GraphQL
registerEnumType(OpMetaAreaEnum, { name: 'OpMetaAreaEnum' });
