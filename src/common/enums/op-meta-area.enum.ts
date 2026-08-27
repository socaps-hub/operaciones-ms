import { registerEnumType } from '@nestjs/graphql';

export enum OpMetaAreaEnum {
  CREDITO = 'CREDITO',
}

// Registros para GraphQL
registerEnumType(OpMetaAreaEnum, { name: 'OpMetaAreaEnum' });
