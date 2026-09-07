import {
  CreditoCarteraDistribucionOutput,
  CreditoCarteraDistribucionRangoOutput,
} from '../../common/dto/outputs/credito-cartera-distribucion.output';

export class CreditoDiasAtrasoRangoOutput extends CreditoCarteraDistribucionRangoOutput {}

export class CreditoDiasAtrasoOutput extends CreditoCarteraDistribucionOutput {
  rangos: CreditoDiasAtrasoRangoOutput[];
}
