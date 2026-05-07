import { CreditoEvaluacionEnum } from '../enums/credito-dashboard.enum';

export function getCreditoEvaluacionColumn(
  evaluacion: CreditoEvaluacionEnum,
): string {
  const columns: Record<CreditoEvaluacionEnum, string> = {
    [CreditoEvaluacionEnum.CLASIFICACION]: 'RA01Tipo',
    [CreditoEvaluacionEnum.TIPO_PAGO]: 'RA01FormaPago',
    [CreditoEvaluacionEnum.PRODUCTO]: 'RA01Categoria',
    [CreditoEvaluacionEnum.TASA]: 'RA01TasaOrdinaria',
    [CreditoEvaluacionEnum.FINALIDAD]: 'RA01Finalidad',
    [CreditoEvaluacionEnum.DESTINO_AGRO]: 'RA01DestinoAgropecuario',
  };

  return columns[evaluacion];
}
