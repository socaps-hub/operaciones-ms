import { Field, ObjectType } from '@nestjs/graphql';
import { CreditoDashboardHeaderOutput } from './credito-dashboard-header.output';
import { CreditoGraficaItemOutput } from './credito-grafica-item.output';
import { CreditoMayorDemandaOutput } from './credito-mayor-demanda.output';
import { CreditoTablaSucursalMesOutput } from './credito-tabla-sucursal-mes.output';
import { CreditoTablaSucursalMesTotalesOutput } from './credito-tabla-sucursal-mes-totales.output';

@ObjectType()
export class CreditoColocacionTotalOutput {
  @Field(() => CreditoDashboardHeaderOutput)
  header: CreditoDashboardHeaderOutput;

  /**
   * Tabla superior por sucursal y mes.
   */
  @Field(() => [CreditoTablaSucursalMesOutput])
  tablaSucursalMes: CreditoTablaSucursalMesOutput[];

  @Field(() => CreditoTablaSucursalMesTotalesOutput)
  tablaSucursalMesTotales: CreditoTablaSucursalMesTotalesOutput;

  /**
   * Primera gráfica: distribución por sucursal usando el mes seleccionado.
   */
  @Field(() => [CreditoGraficaItemOutput])
  graficaSucursal: CreditoGraficaItemOutput[];

  /**
   * Demas gráficas: suma de RA01CEntregada agrupada por evaluación.
   */
  @Field(() => [CreditoGraficaItemOutput])
  graficaEvaluacion: CreditoGraficaItemOutput[];

  @Field(() => CreditoMayorDemandaOutput)
  mayorDemanda: CreditoMayorDemandaOutput;
}
