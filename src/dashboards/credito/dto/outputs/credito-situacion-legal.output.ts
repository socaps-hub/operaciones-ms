import { CreditoCarteraDistribucionOutput } from '../../common/dto/outputs/credito-cartera-distribucion.output';


export class CreditoSituacionLegalItemOutput {
  situacion: string;
  monto: number;
  carteraBanda: number;
  numeroPrestamos: number;
  porcentaje: number;
}

export class CreditoSituacionLegalOutput extends CreditoCarteraDistribucionOutput {
  situaciones: CreditoSituacionLegalItemOutput[];
}
