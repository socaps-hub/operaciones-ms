import { registerEnumType } from '@nestjs/graphql';

export enum CreditoInformeEnum {
  ACUMULADO = 'ACUMULADO',
  MENSUAL = 'MENSUAL',
}

export enum CreditoEvaluacionEnum {
  CLASIFICACION = 'CLASIFICACION',
  TIPO_PAGO = 'TIPO_PAGO',
  PRODUCTO = 'PRODUCTO',
  TASA = 'TASA',
  FINALIDAD = 'FINALIDAD',
  DESTINO_AGRO = 'DESTINO_AGRO',
}

registerEnumType(CreditoInformeEnum, {
  name: 'CreditoInformeEnum',
});

registerEnumType(CreditoEvaluacionEnum, {
  name: 'CreditoEvaluacionEnum',
});
