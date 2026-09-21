export class CreditoProductividadComportamientoItemOutput {
  mes: number;
  colocacionAcumulada: number;
  colocacionMensual: number;
}

export class CreditoProductividadComportamientoOutput {
  periodos: CreditoProductividadComportamientoItemOutput[];
}
