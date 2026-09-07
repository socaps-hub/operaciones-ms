import {
  CreditoCarteraDistribucionOutput,
  CreditoCarteraDistribucionRangoOutput,
} from '../../common/dto/outputs/credito-cartera-distribucion.output';

export class CreditoAmortizacionesVencidasRangoOutput extends CreditoCarteraDistribucionRangoOutput {}

export class CreditoAmortizacionesVencidasOutput extends CreditoCarteraDistribucionOutput {
  rangos: CreditoAmortizacionesVencidasRangoOutput[];
}
