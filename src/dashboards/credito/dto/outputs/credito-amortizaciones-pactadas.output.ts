import {
  CreditoCarteraDistribucionOutput,
  CreditoCarteraDistribucionRangoOutput,
} from '../../common/dto/outputs/credito-cartera-distribucion.output';

export class CreditoAmortizacionesPactadasRangoOutput extends CreditoCarteraDistribucionRangoOutput {}

export class CreditoAmortizacionesPactadasOutput extends CreditoCarteraDistribucionOutput {
  rangos: CreditoAmortizacionesPactadasRangoOutput[];
}
