import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { OP_META_AREA, Prisma, PrismaClient } from '@prisma/client';

import { CreditoColocacionTotalInput } from './dto/inputs/credito-colocacion-total.input';
import { CreditoColocacionTotalOutput } from './dto/outputs/credito-colocacion-total.output';
import { CreditoInformeEnum } from './enums/credito-dashboard.enum';
import { getMonthDateRange } from './utils/credito-date.util';
import { getCreditoEvaluacionColumn } from './utils/credito-evaluacion-column.util';
import { CreditoMedicionAnualInput } from './dto/inputs/credito-medicion-anual.input';
import { CreditoMedicionAnualOutput } from './dto/outputs/credito-medicion-anual.output';
import { CreditoMedicionMensualInput } from './dto/inputs/credito-medicion-mensual.input';
import { CreditoMedicionMensualOutput } from './dto/outputs/credito-medicion-mensual.output';
import { CreditoMedicionTrimestralInput } from './dto/inputs/credito-medicion-trimestral.input';
import { CreditoMedicionTrimestralOutput } from './dto/outputs/credito-medicion-trimestral.output';
import { CreditoMedicionTrimestralMesOutput } from './dto/outputs/credito-medicion-trimestral-mes.output';
import { CreditoFortalezaProductoOutput } from './dto/outputs/credito-fortaleza-producto.output';
import { CreditoFortalezaGrupoOutput } from './dto/outputs/credito-fortaleza-grupo.output';
import {
  CreditoFortalezaColocacionInput,
  CreditoFortalezaEnfoque,
} from './dto/inputs/credito-fortaleza-colocacion.input';
import { CreditoFortalezaColocacionOutput } from './dto/outputs/credito-fortaleza-colocacion.output';
import { CreditoPosicionLogroMetaInput } from './dto/inputs/credito-posicion-logro-meta.input';
import { CreditoPosicionLogroMetaOutput } from './dto/outputs/credito-posicion-logro-meta.output';
import {
  CreditoCumplimientoMensualColocacionMesOutput,
  CreditoCumplimientoMensualColocacionOutput,
} from './dto/outputs/credito-cumplimiento-mensual-colocacion.output';
import { CreditoCumplimientoMensualColocacionInput } from './dto/inputs/credito-cumplimiento-mensual-colocacion.input';
import {
  CreditoComportamientoProductoExtremoOutput,
  CreditoComportamientoProductoMesOutput, CreditoComportamientoProductoOutput,
} from './dto/outputs/credito-comportamiento-producto.output';
import { CreditoComportamientoProductoInput } from './dto/inputs/credito-comportamiento-producto.input';
import { CreditoComportamientoCarteraInput } from './dto/inputs/credito-comportamiento-cartera.input';
import {
  CreditoComportamientoCarteraMesOutput,
  CreditoComportamientoCarteraOutput,
} from './dto/outputs/credito-comportamiento-cartera.output';
import { CreditoComposicionCarteraInput } from './dto/inputs/credito-composicion-cartera.input';
import { CreditoComposicionCarteraOutput } from './dto/outputs/credito-composicion-cartera.output';
import { CreditoDiasAtrasoInput } from './dto/inputs/credito-dias-atraso.input';
import { CreditoDiasAtrasoOutput } from './dto/outputs/credito-dias-atraso.output';
import { CreditoAmortizacionesPactadasInput } from './dto/inputs/credito-amortizaciones-pactadas.input';
import { CreditoAmortizacionesPactadasOutput } from './dto/outputs/credito-amortizaciones-pactadas.output';
import { CreditoAmortizacionesVencidasInput } from './dto/inputs/credito-amortizaciones-vencidas.input';
import { CreditoAmortizacionesVencidasOutput } from './dto/outputs/credito-amortizaciones-vencidas.output';

type FortalezaProductoRow = {
  productoNombre: string;
  colocacion: number;
  prestamos: number;
};

type FortalezaResultado = {
  totalColocacion: number;
  totalPrestamos: number;

  mayores: CreditoFortalezaProductoOutput[];
  menores: CreditoFortalezaProductoOutput[];

  totalMayores: CreditoFortalezaGrupoOutput;
  totalMenores: CreditoFortalezaGrupoOutput;
  resto: CreditoFortalezaGrupoOutput;
};

@Injectable()
export class CreditoService extends PrismaClient implements OnModuleInit {
  private readonly _logger = new Logger('CreditoService');
  private static readonly OFICINA_GLOBAL = 'Global';

  async onModuleInit() {
    await this.$connect();
    this._logger.log('Database connected');
  }

  //   ==================================
  //   COLOCACIÓN TOTAL
  //   ==================================

  async getColocacionTotalDashboard(
    input: CreditoColocacionTotalInput,
  ): Promise<CreditoColocacionTotalOutput> {
    const [
      header,
      tablaSucursalMes,
      tablaSucursalMesTotales,
      graficaSucursal,
      graficaEvaluacion,
      mayorDemanda,
    ] = await Promise.all([
      this._getHeader(input),
      this._getTablaSucursalMes(input),
      this._getTablaSucursalMesTotales(input),
      this._getGraficaSucursal(input),
      this._getGraficaEvaluacion(input),
      this._getMayorDemanda(input),
    ]);

    return {
      header,
      tablaSucursalMes,
      tablaSucursalMesTotales,
      graficaSucursal,
      graficaEvaluacion,
      mayorDemanda,
    };
  }

  //   ==================================
  //   CUMPLIMIENTO - METAS
  //   ==================================

  public async getMedicionAnual(
    input: CreditoMedicionAnualInput,
  ): Promise<CreditoMedicionAnualOutput> {
    try {
      // Buscar el control de metas de crédito para la cooperativa y año.
      const controlMetas = await this.oP00ControlMetaColocacion.findUnique({
        where: {
          OP00CooperativaCodigo_OP00PeriodoAnio_OP00Area: {
            OP00CooperativaCodigo: input.cooperativaId,
            OP00PeriodoAnio: input.periodoAnio,
            OP00Area: OP_META_AREA.CREDITO,
          },
        },
        select: {
          OP00Id: true,
        },
      });

      if (!controlMetas) {
        throw new RpcException({
          message:
            `No existen metas de crédito registradas para el año ` +
            `${input.periodoAnio}.`,
          status: HttpStatus.NOT_FOUND,
        });
      }

      // Si no se seleccionó oficina, se consideran todas las sucursales.
      const oficinaConditionMetas = input.oficina
        ? Prisma.sql`m."OP01SucursalNumero" = ${input.oficina}`
        : Prisma.sql`TRUE`;

      const oficinaConditionCredito = input.oficina
        ? Prisma.sql`r."RA01Sucursal" = ${input.oficina}`
        : Prisma.sql`TRUE`;

      const [[metasRow], [colocacionRow], sucursal] = await Promise.all([
        // Meta anual y meta acumulada esperada hasta el mes seleccionado.
        this.$queryRaw<
          {
            metaAnual: Prisma.Decimal;
            debenLlevar: Prisma.Decimal;
          }[]
        >`
        SELECT
          COALESCE(
            SUM(m."OP01Meta"),
            0
          ) AS "metaAnual",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
              WHERE m."OP01PeriodoMes" <= ${input.periodoMes}
            ),
            0
          ) AS "debenLlevar"

        FROM "OP01MetaColocacion" m

        WHERE
          m."OP01ControlId" = ${controlMetas.OP00Id}
          AND ${oficinaConditionMetas};
      `,

        // Sumar la colocación mensual de cada corte desde enero
        // hasta el mes seleccionado.
        this.$queryRaw<
          {
            colocacionAcumulada: Prisma.Decimal | bigint | number | string;
            controlesEncontrados: bigint | number;
          }[]
        >`
        SELECT
          COALESCE(
            SUM(r."RA01CEntregada"),
            0
          ) AS "colocacionAcumulada",

          COUNT(
            DISTINCT c."C01Id"
          ) AS "controlesEncontrados"

        FROM "C01ControlCarga" c

        INNER JOIN "RA01Credito" r
          ON r."RA01ControlId" = c."C01Id"

        WHERE
          c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid

          AND c."C01PeriodoAnio" = ${input.periodoAnio}

          AND c."C01PeriodoMes"
            BETWEEN 1 AND ${input.periodoMes}

          AND c."C01Area" = 'CREDITO'

          -- Cada corte aporta únicamente la colocación
          -- correspondiente a su propio mes.
          AND r."RA01FEntrega" >=
            TO_CHAR(
              MAKE_DATE(
                c."C01PeriodoAnio",
                c."C01PeriodoMes",
                1
              ),
              'YYYY-MM-DD'
            )

          AND r."RA01FEntrega" <
            TO_CHAR(
              (
                MAKE_DATE(
                  c."C01PeriodoAnio",
                  c."C01PeriodoMes",
                  1
                )
                + INTERVAL '1 month'
              ),
              'YYYY-MM-DD'
            )

          AND ${oficinaConditionCredito};
      `,

        // Obtener el nombre de la sucursal cuando existe filtro.
        input.oficina
          ? this.r11Sucursal.findFirst({
              where: {
                R11Coop_id: input.cooperativaId,
                R11NumSuc: input.oficina,
              },
              select: {
                R11Nom: true,
              },
            })
          : Promise.resolve(null),
      ]);

      const controlesEncontrados = this._toNumber(
        colocacionRow?.controlesEncontrados,
      );

      if (controlesEncontrados === 0) {
        throw new RpcException({
          message:
            `No existen radiografías de crédito registradas entre enero y ` +
            `el mes ${input.periodoMes} del ${input.periodoAnio}.`,
          status: HttpStatus.NOT_FOUND,
        });
      }

      const metaAnual = this._toNumber(metasRow?.metaAnual);

      const debenLlevar = this._toNumber(metasRow?.debenLlevar);

      const colocacionAcumulada = this._toNumber(
        colocacionRow?.colocacionAcumulada,
      );

      const colocacionPorcentaje =
        metaAnual > 0 ? this._toPercentage(colocacionAcumulada, metaAnual) : 0;

      const debenLlevarPorcentaje =
        metaAnual > 0 ? this._toPercentage(debenLlevar, metaAnual) : 0;

      // Este porcentaje será utilizado por el semáforo en frontend.
      const cumplimientoEsperadoPorcentaje =
        debenLlevar > 0
          ? this._toPercentage(colocacionAcumulada, debenLlevar)
          : 0;

      return {
        oficinaNombre: input.oficina
          ? (sucursal?.R11Nom ?? 'Sucursal desconocida')
          : 'Global',

        periodoMes: input.periodoMes,
        periodoAnio: input.periodoAnio,

        metaAnual,

        colocacionAcumulada,
        colocacionPorcentaje,

        debenLlevar,
        debenLlevarPorcentaje,

        cumplimientoEsperadoPorcentaje,

        deficit: colocacionAcumulada - debenLlevar,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al obtener la medición anual de crédito.';

      this._logger.error(`Error en medición anual de crédito: ${message}`);

      throw new RpcException({
        message,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  public async getMedicionMensual(
    input: CreditoMedicionMensualInput,
  ): Promise<CreditoMedicionMensualOutput> {
    try {
      // Buscar en paralelo el corte de crédito y el control de metas.
      const [controlCredito, controlMetas] = await Promise.all([
        this.c01ControlCarga.findFirst({
          where: {
            C01CooperativaCodigo: input.cooperativaId,
            C01PeriodoMes: input.periodoMes,
            C01PeriodoAnio: input.periodoAnio,
            C01Area: 'CREDITO',
          },
          select: {
            C01Id: true,
          },
        }),

        this.oP00ControlMetaColocacion.findUnique({
          where: {
            OP00CooperativaCodigo_OP00PeriodoAnio_OP00Area: {
              OP00CooperativaCodigo: input.cooperativaId,
              OP00PeriodoAnio: input.periodoAnio,
              OP00Area: OP_META_AREA.CREDITO,
            },
          },
          select: {
            OP00Id: true,
          },
        }),
      ]);

      if (!controlCredito) {
        throw new RpcException({
          message:
            `No existe una radiografía de crédito para ` +
            `${input.periodoMes}/${input.periodoAnio}.`,
          status: HttpStatus.NOT_FOUND,
        });
      }

      if (!controlMetas) {
        throw new RpcException({
          message:
            `No existen metas de crédito registradas para el año ` +
            `${input.periodoAnio}.`,
          status: HttpStatus.NOT_FOUND,
        });
      }

      // Si no hay oficina seleccionada, la consulta representa toda la caja.
      const oficinaConditionMeta = input.oficina
        ? Prisma.sql`m."OP01SucursalNumero" = ${input.oficina}`
        : Prisma.sql`TRUE`;

      const oficinaConditionCredito = input.oficina
        ? Prisma.sql`r."RA01Sucursal" = ${input.oficina}`
        : Prisma.sql`TRUE`;

      const fechaInicio = `${input.periodoAnio}-${String(input.periodoMes).padStart(2, '0')}-01`;

      const fechaFin = this._getNextMonthDate(
        input.periodoAnio,
        input.periodoMes,
      );

      const [[metaRow], [colocacionRow], sucursal] = await Promise.all([
        // Meta correspondiente únicamente al mes seleccionado.
        this.$queryRaw<
          {
            metaMes: Prisma.Decimal | number | bigint | string;
          }[]
        >`
        SELECT
          COALESCE(
            SUM(m."OP01Meta"),
            0
          ) AS "metaMes"

        FROM "OP01MetaColocacion" m

        WHERE
          m."OP01ControlId" = ${controlMetas.OP00Id}

          AND m."OP01PeriodoMes" = ${input.periodoMes}

          AND ${oficinaConditionMeta};
      `,

        // Colocación y número de préstamos exclusivamente del mes consultado.
        this.$queryRaw<
          {
            realColocado: Prisma.Decimal | number | bigint | string;

            numeroPrestamos: number | bigint;
          }[]
        >`
        SELECT
          COALESCE(
            SUM(r."RA01CEntregada"),
            0
          ) AS "realColocado",

          COUNT(*) AS "numeroPrestamos"

        FROM "RA01Credito" r

        WHERE
          r."RA01ControlId" = ${controlCredito.C01Id}

          AND r."RA01FEntrega" >= ${fechaInicio}

          AND r."RA01FEntrega" < ${fechaFin}

          AND ${oficinaConditionCredito};
      `,

        // Consultar el nombre solamente cuando se seleccionó una oficina.
        input.oficina
          ? this.r11Sucursal.findFirst({
              where: {
                R11Coop_id: input.cooperativaId,
                R11NumSuc: input.oficina,
              },
              select: {
                R11Nom: true,
              },
            })
          : Promise.resolve(null),
      ]);

      const metaMes = this._toNumber(metaRow?.metaMes);

      const realColocado = this._toNumber(colocacionRow?.realColocado);

      const numeroPrestamos = this._toNumber(colocacionRow?.numeroPrestamos);

      const cumplimientoPorcentaje =
        metaMes > 0 ? this._toPercentage(realColocado, metaMes) : 0;

      const faltante = realColocado - metaMes;

      return {
        oficinaNombre: input.oficina
          ? (sucursal?.R11Nom ?? 'Sucursal desconocida')
          : 'Global',

        periodoMes: input.periodoMes,
        periodoAnio: input.periodoAnio,

        metaMes,

        realColocado,

        cumplimientoPorcentaje,

        faltante,

        numeroPrestamos,

        cumplioMeta: metaMes > 0 && realColocado >= metaMes,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al obtener la medición mensual de crédito.';

      this._logger.error(`Error en medición mensual de crédito: ${message}`);

      throw new RpcException({
        message,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  public async getMedicionTrimestral(
    input: CreditoMedicionTrimestralInput,
  ): Promise<CreditoMedicionTrimestralOutput> {
    try {
      const { numeroTrimestre, mesInicio, mesFin } = this._getQuarter(
        input.periodoMes,
      );

      /*
       * Sólo calculamos hasta el período seleccionado.
       *
       * Ejemplo:
       * periodoMes = 7
       * trimestre = Jul-Sep
       * meses calculables = [7]
       *
       * periodoMes = 8
       * meses calculables = [7, 8]
       *
       * periodoMes = 9
       * meses calculables = [7, 8, 9]
       */
      const mesesCalculables = Array.from(
        {
          length: input.periodoMes - mesInicio + 1,
        },
        (_, index) => mesInicio + index,
      );

      /*
       * Localizamos los C01 correspondientes a los meses
       * cerrados del trimestre.
       */
      const controles = await this.c01ControlCarga.findMany({
        where: {
          C01CooperativaCodigo: input.cooperativaId,
          C01PeriodoAnio: input.periodoAnio,
          C01PeriodoMes: {
            in: mesesCalculables,
          },
          C01Area: 'CREDITO',
        },
        select: {
          C01Id: true,
          C01PeriodoMes: true,
        },
      });

      /*
       * Creamos un mapa:
       *
       * mes -> control C01
       */
      const controlPorMes = new Map(
        controles.map((control) => [control.C01PeriodoMes, control.C01Id]),
      );

      const oficinaCondition = input.oficina
        ? Prisma.sql`AND r."RA01Sucursal" = ${input.oficina}`
        : Prisma.empty;

      /*
       * Cada mes mantiene exactamente la misma lógica
       * de Medición Mensual:
       *
       * C01 del mes
       * +
       * RA01FEntrega dentro del mismo mes
       */
      const resultadosMensuales = await Promise.all(
        mesesCalculables.map(async (mes) => {
          const controlId = controlPorMes.get(mes);

          if (!controlId) {
            return {
              periodoMes: mes,
              capitalColocado: null,
              disponible: false,
            };
          }

          const fechaInicio = `${input.periodoAnio}-${String(mes).padStart(2, '0')}-01`;

          const fechaFin = this._getNextMonthDate(input.periodoAnio, mes);

          const [row] = await this.$queryRaw<
            {
              capitalColocado: Prisma.Decimal | number | bigint | string;
            }[]
          >`
            SELECT
              COALESCE(
                SUM(r."RA01CEntregada"),
                0
              ) AS "capitalColocado"

            FROM "RA01Credito" r

            WHERE
              r."RA01ControlId" = ${controlId}

              AND r."RA01FEntrega" >= ${fechaInicio}

              AND r."RA01FEntrega" < ${fechaFin}

              ${oficinaCondition};
          `;

          return {
            periodoMes: mes,
            capitalColocado: this._toNumber(row?.capitalColocado),
            disponible: true,
          };
        }),
      );

      /*
       * Construimos siempre los tres meses del trimestre.
       *
       * Los posteriores a periodoMes quedan como null,
       * porque todavía no corresponden al período cerrado.
       */
      const meses: CreditoMedicionTrimestralMesOutput[] = Array.from(
        {
          length: mesFin - mesInicio + 1,
        },
        (_, index) => {
          const periodoMes = mesInicio + index;

          // Mes futuro respecto al período consultado.
          if (periodoMes > input.periodoMes) {
            return {
              periodoMes,
              capitalColocado: null,
              disponible: false,
            };
          }

          const resultado = resultadosMensuales.find(
            (item) => item.periodoMes === periodoMes,
          );

          return {
            periodoMes,
            capitalColocado: resultado?.capitalColocado ?? null,

            disponible: resultado?.disponible ?? false,
          };
        },
      );

      const capitalColocadoTrimestre = meses.reduce(
        (total, mes) => total + (mes.capitalColocado ?? 0),
        0,
      );

      const sucursal = input.oficina
        ? await this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,

              R11NumSuc: input.oficina,
            },
            select: {
              R11Nom: true,
            },
          })
        : null;

      return {
        oficinaNombre: input.oficina
          ? (sucursal?.R11Nom ?? 'Sucursal desconocida')
          : 'Global',

        periodoMes: input.periodoMes,

        periodoAnio: input.periodoAnio,

        numeroTrimestre,

        mesInicioTrimestre: mesInicio,

        mesFinTrimestre: mesFin,

        capitalColocadoTrimestre,

        meses,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al obtener la medición trimestral de crédito.';

      this._logger.error(`Error en medición trimestral de crédito: ${message}`);

      throw new RpcException({
        message,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  public async getFortalezaColocacion(
    input: CreditoFortalezaColocacionInput,
  ): Promise<CreditoFortalezaColocacionOutput> {
    const oficina = input.oficina?.trim() || undefined;

    const [productosMensual, productosAcumulado] = await Promise.all([
      this._getFortalezaProductos({
        cooperativaId: input.cooperativaId,

        periodoMes: input.periodoMes,

        periodoAnio: input.periodoAnio,

        oficina,

        enfoque: CreditoFortalezaEnfoque.MENSUAL,
      }),

      this._getFortalezaProductos({
        cooperativaId: input.cooperativaId,

        periodoMes: input.periodoMes,

        periodoAnio: input.periodoAnio,

        oficina,

        enfoque: CreditoFortalezaEnfoque.ACUMULADO,
      }),
    ]);

    const mensual = this._buildFortalezaResultado(productosMensual);

    const acumulado = this._buildFortalezaResultado(productosAcumulado);

    const seleccionado =
      input.enfoque === CreditoFortalezaEnfoque.MENSUAL ? mensual : acumulado;

    let oficinaNombre = 'GLOBAL';

    if (oficina !== undefined) {
      const sucursal = await this.r11Sucursal.findFirst({
        where: {
          R11Coop_id: input.cooperativaId,

          R11NumSuc: input.oficina,
        },

        select: {
          R11Nom: true,
        },
      });

      oficinaNombre = sucursal?.R11Nom ?? `Sucursal ${input.oficina}`;
    }

    return {
      oficinaNombre,

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      enfoque: input.enfoque,

      totalColocacion: seleccionado.totalColocacion,

      totalPrestamos: seleccionado.totalPrestamos,

      mayores: seleccionado.mayores,

      menores: seleccionado.menores,

      totalMayores: seleccionado.totalMayores,

      totalMenores: seleccionado.totalMenores,

      resto: seleccionado.resto,

      resumenAcumulado: {
        totalMayores: acumulado.totalMayores,

        totalMenores: acumulado.totalMenores,

        resto: acumulado.resto,
      },

      resumenMensual: {
        totalMayores: mensual.totalMayores,

        totalMenores: mensual.totalMenores,

        resto: mensual.resto,
      },
    };
  }

  public async getPosicionLogroMeta(
    input: CreditoPosicionLogroMetaInput,
  ): Promise<CreditoPosicionLogroMetaOutput> {
    const fechaInicio = `${input.periodoAnio}-${String(input.periodoMes).padStart(2, '0')}-01`;

    const fechaFin = this._getNextMonthDate(
      input.periodoAnio,
      input.periodoMes,
    );

    const [controlRadiografia, metas, sucursales] = await Promise.all([
      this.c01ControlCarga.findFirst({
        where: {
          C01CooperativaCodigo: input.cooperativaId,
          C01PeriodoMes: input.periodoMes,
          C01PeriodoAnio: input.periodoAnio,
          C01Area: 'CREDITO',
        },
        select: {
          C01Id: true,
        },
      }),

      this.oP01MetaColocacion.findMany({
        where: {
          control: {
            OP00CooperativaCodigo: input.cooperativaId,
            OP00Area: 'CREDITO',
            OP00PeriodoAnio: input.periodoAnio,
          },
          OP01PeriodoMes: input.periodoMes,
        },
        select: {
          OP01SucursalNumero: true,
          OP01Meta: true,
        },
      }),

      this.r11Sucursal.findMany({
        where: {
          R11Coop_id: input.cooperativaId,
        },
        select: {
          R11NumSuc: true,
          R11Nom: true,
        },
      }),
    ]);

    const colocacionPorSucursal = controlRadiografia
      ? await this.$queryRaw<
          {
            oficinaNumero: string | null;
            colocacionReal: Prisma.Decimal | number | bigint | string;
          }[]
        >`
        SELECT
          r."RA01Sucursal" AS "oficinaNumero",

          COALESCE(
            SUM(r."RA01CEntregada"),
            0
          ) AS "colocacionReal"

        FROM "RA01Credito" r

        WHERE
          r."RA01ControlId" = ${controlRadiografia.C01Id}

          AND r."RA01FEntrega" >= ${fechaInicio}

          AND r."RA01FEntrega" < ${fechaFin}

        GROUP BY
          r."RA01Sucursal";
      `
      : [];

    const colocacionMap = new Map<string, number>();

    for (const row of colocacionPorSucursal) {
      if (!row.oficinaNumero) {
        continue;
      }

      const sucursalNumero = this._normalizeSucursal(row.oficinaNumero);

      if (!sucursalNumero) {
        continue;
      }

      colocacionMap.set(sucursalNumero, this._toNumber(row.colocacionReal));
    }

    const metaMap = new Map<string, number>();

    for (const meta of metas) {
      const sucursalNumero = this._normalizeSucursal(meta.OP01SucursalNumero);

      if (!sucursalNumero) {
        continue;
      }

      metaMap.set(sucursalNumero, this._toNumber(meta.OP01Meta));
    }

    const oficinas = sucursales
      .sort((a, b) => Number(a.R11NumSuc) - Number(b.R11NumSuc))
      .map((sucursal) => {
        const sucursalNumero = this._normalizeSucursal(sucursal.R11NumSuc);

        const metaMensual = metaMap.get(sucursalNumero) ?? 0;

        const colocacionReal = colocacionMap.get(sucursalNumero) ?? 0;

        const cumplimientoPorcentaje =
          metaMensual > 0 ? (colocacionReal / metaMensual) * 100 : 0;

        return {
          oficinaNumero: sucursalNumero,
          oficinaNombre: sucursal.R11Nom,
          metaMensual,
          colocacionReal,
          cumplimientoPorcentaje,
          cumplioMeta: metaMensual > 0 && colocacionReal >= metaMensual,
        };
      });

    const totalMetaMensual = oficinas.reduce(
      (total, oficina) => total + oficina.metaMensual,
      0,
    );

    const totalColocacionReal = oficinas.reduce(
      (total, oficina) => total + oficina.colocacionReal,
      0,
    );

    const totalCumplimientoPorcentaje =
      totalMetaMensual > 0 ? (totalColocacionReal / totalMetaMensual) * 100 : 0;

    oficinas.push({
      oficinaNumero: 'TOTAL',
      oficinaNombre: 'Total',

      metaMensual: totalMetaMensual,

      colocacionReal: totalColocacionReal,

      cumplimientoPorcentaje: totalCumplimientoPorcentaje,

      cumplioMeta:
        totalMetaMensual > 0 && totalColocacionReal >= totalMetaMensual,
    });

    return {
      periodoMes: input.periodoMes,
      periodoAnio: input.periodoAnio,
      oficinas,
    };
  }

  public async getCumplimientoMensualColocacion(
    input: CreditoCumplimientoMensualColocacionInput,
  ): Promise<CreditoCumplimientoMensualColocacionOutput> {
    const oficina = input.oficina?.trim() || undefined;

    const [metas, sucursal] = await Promise.all([
      this.oP01MetaColocacion.findMany({
        where: {
          control: {
            OP00CooperativaCodigo: input.cooperativaId,
            OP00Area: 'CREDITO',
            OP00PeriodoAnio: input.periodoAnio,
          },

          ...(oficina
            ? {
                OP01SucursalNumero: oficina,
              }
            : {}),
        },

        select: {
          OP01PeriodoMes: true,
          OP01Meta: true,
        },
      }),

      oficina
        ? this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,
              R11NumSuc: oficina,
            },

            select: {
              R11NumSuc: true,
              R11Nom: true,
            },
          })
        : Promise.resolve(null),
    ]);

    const metaMap = new Map<number, number>();

    for (const meta of metas) {
      const actual = metaMap.get(meta.OP01PeriodoMes) ?? 0;

      metaMap.set(meta.OP01PeriodoMes, actual + this._toNumber(meta.OP01Meta));
    }

    const colocacionRows = await this.$queryRaw<
      {
        periodoMes: number;
        colocacion: Prisma.Decimal | number | bigint | string;
      }[]
    >`
        SELECT
          c."C01PeriodoMes" AS "periodoMes",

          COALESCE(
            SUM(r."RA01CEntregada"),
            0
          ) AS "colocacion"

        FROM "C01ControlCarga" c

               LEFT JOIN "RA01Credito" r
                         ON r."RA01ControlId" = c."C01Id"

          ${
            oficina
              ? Prisma.sql`
              AND r."RA01Sucursal" = ${oficina}
            `
              : Prisma.empty
          }

      AND TO_DATE(
        r."RA01FEntrega",
        'YYYY-MM-DD'
      ) >= MAKE_DATE(
          ${input.periodoAnio}::int,
          c."C01PeriodoMes",
          1
          )

          AND TO_DATE(
          r."RA01FEntrega",
          'YYYY-MM-DD'
          ) < (
          MAKE_DATE(
          ${input.periodoAnio}::int,
          c."C01PeriodoMes",
          1
          )
          + INTERVAL '1 month'
          )

        WHERE
          c."C01CooperativaCodigo" =
          ${input.cooperativaId}::uuid

          AND c."C01PeriodoAnio" =
          ${input.periodoAnio}

          AND c."C01PeriodoMes" <=
          ${input.periodoMes}

          AND c."C01Area" =
          'CREDITO'

        GROUP BY
          c."C01PeriodoMes"

        ORDER BY
          c."C01PeriodoMes";
      `;

    const colocacionMap = new Map<number, number>();

    for (const row of colocacionRows) {
      colocacionMap.set(Number(row.periodoMes), this._toNumber(row.colocacion));
    }

    const meses: CreditoCumplimientoMensualColocacionMesOutput[] = Array.from(
      { length: 12 },
      (_, index) => {
        const periodoMes = index + 1;

        const esPeriodoTranscurrido = periodoMes <= input.periodoMes;

        const tieneRadiografia = colocacionMap.has(periodoMes);

        const disponible = esPeriodoTranscurrido && tieneRadiografia;

        return {
          periodoMes,

          meta: metaMap.get(periodoMes) ?? 0,

          colocacion: disponible ? colocacionMap.get(periodoMes)! : null,

          disponible,
        };
      },
    );

    return {
      oficinaNumero: oficina ?? null,

      oficinaNombre: oficina ? (sucursal?.R11Nom ?? oficina) : 'Global',

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      meses,
    };
  }

  public async getComportamientoProducto(
    input: CreditoComportamientoProductoInput,
  ): Promise<CreditoComportamientoProductoOutput> {
    const oficina = input.oficina?.trim() || undefined;
    const productoId = input.productoId?.trim() || undefined;

    const [sucursal, producto] = await Promise.all([
      oficina
        ? this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,
              R11NumSuc: oficina,
            },
            select: {
              R11Nom: true,
            },
          })
        : Promise.resolve(null),

      productoId
        ? this.r13Producto.findFirst({
            where: {
              R13Id: productoId,
              R13Coop_id: input.cooperativaId,
            },
            select: {
              R13Nom: true,
              categoria: {
                select: {
                  R14Nom: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    if (productoId && !producto) {
      throw new BadRequestException(
        'El producto seleccionado no existe en la cooperativa.',
      );
    }

    const productoNombre = producto?.R13Nom.trim();
    const categoriaNombre = producto?.categoria.R14Nom.trim();

    const colocacionRows = await this.$queryRaw<
      {
        periodoMes: number;
        colocacion: Prisma.Decimal | number | bigint | string;
      }[]
    >`
    SELECT
      c."C01PeriodoMes" AS "periodoMes",

      COALESCE(
        SUM(r."RA01CEntregada"),
        0
      ) AS "colocacion"

    FROM "C01ControlCarga" c

    LEFT JOIN "RA01Credito" r
      ON r."RA01ControlId" = c."C01Id"

      ${
        oficina
          ? Prisma.sql`
              AND r."RA01Sucursal" = ${oficina}
            `
          : Prisma.empty
      }

      ${
        productoNombre && categoriaNombre
          ? Prisma.sql`
              AND LOWER(r."RA01Categoria") = LOWER(${productoNombre})
              AND LOWER(r."RA01Tipo") = LOWER(${categoriaNombre})
            `
          : Prisma.empty
      }

      AND r."RA01FEntrega" >=
        TO_CHAR(
          MAKE_DATE(
            ${input.periodoAnio}::int,
            c."C01PeriodoMes",
            1
          ),
          'YYYY-MM-DD'
        )

      AND r."RA01FEntrega" <
        TO_CHAR(
          (
            MAKE_DATE(
              ${input.periodoAnio}::int,
              c."C01PeriodoMes",
              1
            )
            + INTERVAL '1 month'
          ),
          'YYYY-MM-DD'
        )

    WHERE
      c."C01CooperativaCodigo" =
        ${input.cooperativaId}::uuid

      AND c."C01PeriodoAnio" =
        ${input.periodoAnio}

      AND c."C01PeriodoMes" <=
        ${input.periodoMes}

      AND c."C01Area" =
        'CREDITO'

    GROUP BY
      c."C01PeriodoMes"

    ORDER BY
      c."C01PeriodoMes";
  `;

    const colocacionMap = new Map<number, number>(
      colocacionRows.map((row) => [
        Number(row.periodoMes),
        this._toNumber(row.colocacion),
      ]),
    );

    const meses: CreditoComportamientoProductoMesOutput[] = Array.from(
      { length: 12 },
      (_, index) => {
        const periodoMes = index + 1;

        const disponible =
          periodoMes <= input.periodoMes && colocacionMap.has(periodoMes);

        return {
          periodoMes,
          colocacion: disponible ? colocacionMap.get(periodoMes)! : null,
          disponible,
        };
      },
    );

    const mesesDisponibles = meses.filter(
      (
        mes,
      ): mes is CreditoComportamientoProductoMesOutput & {
        colocacion: number;
      } => mes.disponible && mes.colocacion !== null,
    );

    const masAlto = this._getExtremoColocacion(mesesDisponibles, 'MAX');

    const masBajo = this._getExtremoColocacion(mesesDisponibles, 'MIN');

    return {
      oficinaNumero: oficina ?? null,

      oficinaNombre: oficina ? (sucursal?.R11Nom ?? oficina) : 'Global',

      productoNombre: productoNombre ?? 'Todos los productos',

      productoCategoria: categoriaNombre ?? 'Todas las categorías',

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      meses,

      masAlto,

      masBajo,
    };
  }

  // ====================================
  // CALIDAD DE LA CARTERA
  // ====================================
  public async getComportamientoCartera(
    input: CreditoComportamientoCarteraInput,
  ): Promise<CreditoComportamientoCarteraOutput> {
    const oficina = input.oficina?.trim() || undefined;
    const productoId = input.productoId?.trim() || undefined;

    const [sucursal, producto] = await Promise.all([
      oficina
        ? this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,
              R11NumSuc: oficina,
            },
            select: {
              R11Nom: true,
            },
          })
        : Promise.resolve(null),

      productoId
        ? this.r13Producto.findFirst({
            where: {
              R13Id: productoId,
              R13Coop_id: input.cooperativaId,
            },
            select: {
              R13Id: true,
              R13Nom: true,
              categoria: {
                select: {
                  R14Nom: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    if (productoId && !producto) {
      throw new BadRequestException(
        'El producto seleccionado no pertenece a la cooperativa.',
      );
    }

    const productoNombre = producto?.R13Nom ?? null;
    const productoCategoria = producto?.categoria.R14Nom ?? null;

    const [rows, carteraTotalOficinaRows] = await Promise.all([
      this.$queryRaw<
        {
          periodoMes: number;
          saldo: Prisma.Decimal | number | bigint | string;
          numeroPrestamos: bigint | number | string;

          vigente: Prisma.Decimal | number | bigint | string;
          prestamosVigentes: bigint | number | string;

          vencida: Prisma.Decimal | number | bigint | string;
          prestamosVencidos: bigint | number | string;
        }[]
      >`
      SELECT
        c."C01PeriodoMes" AS "periodoMes",

        COALESCE(
          SUM(r."RA01TotalCartera"),
          0
        ) AS "saldo",

        COUNT(r."RA01Folio") AS "numeroPrestamos",

        COALESCE(
          SUM(
            CASE
              WHEN r."RA01VigenteOVencido" = 'Vigente'
              THEN r."RA01TotalCartera"
              ELSE 0
            END
          ),
          0
        ) AS "vigente",

        COUNT(
          CASE
            WHEN r."RA01VigenteOVencido" = 'Vigente'
            THEN 1
          END
        ) AS "prestamosVigentes",

        COALESCE(
          SUM(
            CASE
              WHEN r."RA01VigenteOVencido" = 'Vencido'
              THEN r."RA01TotalCartera"
              ELSE 0
            END
          ),
          0
        ) AS "vencida",

        COUNT(
          CASE
            WHEN r."RA01VigenteOVencido" = 'Vencido'
            THEN 1
          END
        ) AS "prestamosVencidos"

      FROM "C01ControlCarga" c

      LEFT JOIN "RA01Credito" r
        ON r."RA01ControlId" = c."C01Id"

        ${
          oficina
            ? Prisma.sql`
                AND r."RA01Sucursal" = ${oficina}
              `
            : Prisma.empty
        }

        ${
          productoNombre && productoCategoria
            ? Prisma.sql`
                AND LOWER(r."RA01Categoria") = LOWER(${productoNombre})
                AND LOWER(r."RA01Tipo") = LOWER(${productoCategoria})
              `
            : Prisma.empty
        }

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01PeriodoMes" <= ${input.periodoMes}
        AND c."C01Area" = 'CREDITO'

      GROUP BY
        c."C01PeriodoMes"

      ORDER BY
        c."C01PeriodoMes";
    `,

      this.$queryRaw<
        {
          saldo: Prisma.Decimal | number | bigint | string;
        }[]
      >`
      SELECT
        COALESCE(
          SUM(r."RA01TotalCartera"),
          0
        ) AS "saldo"

      FROM "C01ControlCarga" c

      LEFT JOIN "RA01Credito" r
        ON r."RA01ControlId" = c."C01Id"

        ${
          oficina
            ? Prisma.sql`
                AND r."RA01Sucursal" = ${oficina}
              `
            : Prisma.empty
        }

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01PeriodoMes" = ${input.periodoMes}
        AND c."C01Area" = 'CREDITO';
    `,
    ]);

    const rowMap = new Map(
      rows.map((row) => [
        Number(row.periodoMes),
        {
          saldo: this._toNumber(row.saldo),
          numeroPrestamos: this._toNumber(row.numeroPrestamos),

          vigente: this._toNumber(row.vigente),
          prestamosVigentes: this._toNumber(row.prestamosVigentes),

          vencida: this._toNumber(row.vencida),
          prestamosVencidos: this._toNumber(row.prestamosVencidos),
        },
      ]),
    );

    const meses: CreditoComportamientoCarteraMesOutput[] = Array.from(
      { length: 12 },
      (_, index) => {
        const periodoMes = index + 1;

        const disponible =
          periodoMes <= input.periodoMes && rowMap.has(periodoMes);

        return {
          periodoMes,
          saldo: disponible ? rowMap.get(periodoMes)!.saldo : null,
          disponible,
        };
      },
    );

    const saldosDisponibles = meses
      .filter(
        (
          mes,
        ): mes is CreditoComportamientoCarteraMesOutput & {
          saldo: number;
        } => mes.disponible && mes.saldo !== null,
      )
      .map((mes) => mes.saldo);

    const saldoPromedio =
      saldosDisponibles.length > 0
        ? saldosDisponibles.reduce((total, saldo) => total + saldo, 0) /
          saldosDisponibles.length
        : 0;

    const periodoSeleccionado = rowMap.get(input.periodoMes);

    const saldo = periodoSeleccionado?.saldo ?? 0;

    const numeroPrestamos = periodoSeleccionado?.numeroPrestamos ?? 0;

    const vigente = periodoSeleccionado?.vigente ?? 0;

    const prestamosVigentes = periodoSeleccionado?.prestamosVigentes ?? 0;

    const vencida = periodoSeleccionado?.vencida ?? 0;

    const prestamosVencidos = periodoSeleccionado?.prestamosVencidos ?? 0;

    const carteraTotalOficina = this._toNumber(
      carteraTotalOficinaRows[0]?.saldo,
    );

    const participacionOficinaPorcentaje =
      carteraTotalOficina > 0 ? (saldo / carteraTotalOficina) * 100 : 0;

    const vigentePorcentaje = saldo > 0 ? (vigente / saldo) * 100 : 0;

    const vencidaPorcentaje = saldo > 0 ? (vencida / saldo) * 100 : 0;

    return {
      oficinaNumero: oficina ?? null,

      oficinaNombre: oficina ? (sucursal?.R11Nom ?? oficina) : 'Global',

      productoId: producto?.R13Id ?? null,

      productoNombre: producto?.R13Nom ?? 'Todos los productos',

      productoCategoria: producto?.categoria.R14Nom ?? null,

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      saldoPromedio,

      resumen: {
        saldo,
        numeroPrestamos,

        participacionOficinaPorcentaje,

        vigente,
        prestamosVigentes,
        vigentePorcentaje,

        vencida,
        prestamosVencidos,
        vencidaPorcentaje,
      },

      meses,
    };
  }

  public async getComposicionCartera(
    input: CreditoComposicionCarteraInput,
  ): Promise<CreditoComposicionCarteraOutput> {
    const oficina = input.oficina?.trim() || undefined;

    const [sucursal, rows] = await Promise.all([
      oficina
        ? this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,
              R11NumSuc: oficina,
            },
            select: {
              R11Nom: true,
            },
          })
        : Promise.resolve(null),

      this.$queryRaw<
        {
          productoNombre: string;
          productoCategoria: string;

          saldo: Prisma.Decimal | number | bigint | string;
          vigente: Prisma.Decimal | number | bigint | string;
          vencida: Prisma.Decimal | number | bigint | string;

          numeroPrestamos: bigint | number | string;
          prestamosVigentes: bigint | number | string;
          prestamosVencidos: bigint | number | string;
        }[]
      >`
      SELECT
        r."RA01Categoria" AS "productoNombre",
        r."RA01Tipo" AS "productoCategoria",

        COALESCE(
          SUM(r."RA01TotalCartera"),
          0
        ) AS "saldo",

        COALESCE(
          SUM(
            CASE
              WHEN r."RA01VigenteOVencido" = 'Vigente'
              THEN r."RA01TotalCartera"
              ELSE 0
            END
          ),
          0
        ) AS "vigente",

        COALESCE(
          SUM(
            CASE
              WHEN r."RA01VigenteOVencido" = 'Vencido'
              THEN r."RA01TotalCartera"
              ELSE 0
            END
          ),
          0
        ) AS "vencida",

        COUNT(r."RA01Folio") AS "numeroPrestamos",

        COUNT(
          CASE
            WHEN r."RA01VigenteOVencido" = 'Vigente'
            THEN 1
          END
        ) AS "prestamosVigentes",

        COUNT(
          CASE
            WHEN r."RA01VigenteOVencido" = 'Vencido'
            THEN 1
          END
        ) AS "prestamosVencidos"

      FROM "C01ControlCarga" c

      INNER JOIN "RA01Credito" r
        ON r."RA01ControlId" = c."C01Id"

        ${
          oficina
            ? Prisma.sql`
                AND r."RA01Sucursal" = ${oficina}
              `
            : Prisma.empty
        }

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01PeriodoMes" = ${input.periodoMes}
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01Area" = 'CREDITO'

      GROUP BY
        r."RA01Categoria",
        r."RA01Tipo"

      ORDER BY
        SUM(r."RA01TotalCartera") DESC;
    `,
    ]);

    const productos = rows.map((row) => {
      const saldo = this._toNumber(row.saldo);
      const vigente = this._toNumber(row.vigente);
      const vencida = this._toNumber(row.vencida);

      return {
        productoNombre: row.productoNombre,
        productoCategoria: row.productoCategoria,

        saldo,
        vigente,
        vencida,

        vigentePorcentaje: saldo > 0 ? (vigente / saldo) * 100 : 0,

        vencidaPorcentaje: saldo > 0 ? (vencida / saldo) * 100 : 0,

        numeroPrestamos: this._toNumber(row.numeroPrestamos),

        prestamosVigentes: this._toNumber(row.prestamosVigentes),

        prestamosVencidos: this._toNumber(row.prestamosVencidos),
      };
    });

    return {
      oficinaNumero: oficina ?? null,

      oficinaNombre: oficina ? (sucursal?.R11Nom ?? oficina) : 'Global',

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      productos,
    };
  }

  public async getDiasAtraso(
    input: CreditoDiasAtrasoInput,
  ): Promise<CreditoDiasAtrasoOutput> {
    const oficina = input.oficina?.trim() || undefined;

    let productoNombre: string | null = null;
    let productoCategoria: string | null = null;

    if (input.productoId) {
      const producto = await this.r13Producto.findFirst({
        where: {
          R13Id: input.productoId,
          R13Coop_id: input.cooperativaId,
        },
        select: {
          R13Nom: true,
          categoria: {
            select: {
              R14Nom: true,
            },
          },
        },
      });

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      productoNombre = producto.R13Nom;
      productoCategoria = producto.categoria.R14Nom;
    }

    const productoWhere = input.productoId
      ? Prisma.sql`
        AND LOWER(r."RA01Categoria") = LOWER(${productoNombre!})
        AND LOWER(r."RA01Tipo") = LOWER(${productoCategoria!})
      `
      : Prisma.empty;

    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA01Sucursal" = ${oficina}
      `
      : Prisma.empty;

    const [sucursal, segmentoRows, totalRows] = await Promise.all([
      oficina
        ? this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,
              R11NumSuc: oficina,
            },
            select: {
              R11Nom: true,
            },
          })
        : Promise.resolve(null),

      this.$queryRaw<
        {
          rango: string;
          orden: number;
          monto: Prisma.Decimal | number | bigint | string;
          numeroPrestamos: bigint | number | string;
        }[]
      >`
      SELECT
        CASE
          WHEN r."RA01DiasMora" = 0 THEN '0 días'
          WHEN r."RA01DiasMora" BETWEEN 1 AND 30 THEN '1-30'
          WHEN r."RA01DiasMora" BETWEEN 31 AND 60 THEN '31-60'
          WHEN r."RA01DiasMora" BETWEEN 61 AND 90 THEN '61-90'
          WHEN r."RA01DiasMora" BETWEEN 91 AND 120 THEN '91-120'
          WHEN r."RA01DiasMora" >= 121 THEN '121 o más'
        END AS "rango",

        CASE
          WHEN r."RA01DiasMora" = 0 THEN 1
          WHEN r."RA01DiasMora" BETWEEN 1 AND 30 THEN 2
          WHEN r."RA01DiasMora" BETWEEN 31 AND 60 THEN 3
          WHEN r."RA01DiasMora" BETWEEN 61 AND 90 THEN 4
          WHEN r."RA01DiasMora" BETWEEN 91 AND 120 THEN 5
          WHEN r."RA01DiasMora" >= 121 THEN 6
        END AS "orden",

        COALESCE(
          SUM(r."RA01TotalCartera"),
          0
        ) AS "monto",

        COUNT(*) AS "numeroPrestamos"

      FROM "C01ControlCarga" c

      INNER JOIN "RA01Credito" r
        ON r."RA01ControlId" = c."C01Id"

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01PeriodoMes" = ${input.periodoMes}
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01Area" = 'CREDITO'

        ${oficinaWhere}
        ${productoWhere}

        AND r."RA01DiasMora" IS NOT NULL

      GROUP BY
        "rango",
        "orden"

      ORDER BY
        "orden";
    `,

      input.productoId
        ? this.$queryRaw<
            {
              rango: string;
              orden: number;
              monto: Prisma.Decimal | number | bigint | string;
            }[]
          >`
          SELECT
            CASE
              WHEN r."RA01DiasMora" = 0 THEN '0 días'
              WHEN r."RA01DiasMora" BETWEEN 1 AND 30 THEN '1-30'
              WHEN r."RA01DiasMora" BETWEEN 31 AND 60 THEN '31-60'
              WHEN r."RA01DiasMora" BETWEEN 61 AND 90 THEN '61-90'
              WHEN r."RA01DiasMora" BETWEEN 91 AND 120 THEN '91-120'
              WHEN r."RA01DiasMora" >= 121 THEN '121 o más'
            END AS "rango",

            CASE
              WHEN r."RA01DiasMora" = 0 THEN 1
              WHEN r."RA01DiasMora" BETWEEN 1 AND 30 THEN 2
              WHEN r."RA01DiasMora" BETWEEN 31 AND 60 THEN 3
              WHEN r."RA01DiasMora" BETWEEN 61 AND 90 THEN 4
              WHEN r."RA01DiasMora" BETWEEN 91 AND 120 THEN 5
              WHEN r."RA01DiasMora" >= 121 THEN 6
            END AS "orden",

            COALESCE(
              SUM(r."RA01TotalCartera"),
              0
            ) AS "monto"

          FROM "C01ControlCarga" c

          INNER JOIN "RA01Credito" r
            ON r."RA01ControlId" = c."C01Id"

          WHERE
            c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
            AND c."C01PeriodoMes" = ${input.periodoMes}
            AND c."C01PeriodoAnio" = ${input.periodoAnio}
            AND c."C01Area" = 'CREDITO'

            ${oficinaWhere}

            AND r."RA01DiasMora" IS NOT NULL

          GROUP BY
            "rango",
            "orden"

          ORDER BY
            "orden";
        `
        : Promise.resolve([]),
    ]);

    const rangoDefinitions = [
      {
        rango: '0 días',
        desde: 0,
        hasta: 0,
      },
      {
        rango: '1-30',
        desde: 1,
        hasta: 30,
      },
      {
        rango: '31-60',
        desde: 31,
        hasta: 60,
      },
      {
        rango: '61-90',
        desde: 61,
        hasta: 90,
      },
      {
        rango: '91-120',
        desde: 91,
        hasta: 120,
      },
      {
        rango: '121 o más',
        desde: 121,
        hasta: null,
      },
    ];

    const segmentoMap = new Map<
      string,
      { monto: number; numeroPrestamos: number }
    >(
      segmentoRows.map(
        (
          row,
        ): [
          string,
          {
            monto: number;
            numeroPrestamos: number;
          },
        ] => [
          row.rango,
          {
            monto: this._toNumber(row.monto),
            numeroPrestamos: this._toNumber(row.numeroPrestamos),
          },
        ],
      ),
    );

    const totalPorRangoMap = new Map<string, number>(
      totalRows.map((row): [string, number] => [
        row.rango,
        this._toNumber(row.monto),
      ]),
    );

    const totalCartera = Array.from(segmentoMap.values()).reduce(
      (total, row) => total + row.monto,
      0,
    );

    const numeroPrestamos = Array.from(segmentoMap.values()).reduce(
      (total, row) => total + row.numeroPrestamos,
      0,
    );

    const rangos = rangoDefinitions.map((definition) => {
      const segmento = segmentoMap.get(definition.rango) ?? {
        monto: 0,
        numeroPrestamos: 0,
      };

      const carteraBanda = input.productoId
        ? (totalPorRangoMap.get(definition.rango) ?? 0)
        : segmento.monto;

      let porcentaje = 0;

      if (input.productoId) {
        porcentaje =
          carteraBanda > 0 ? (segmento.monto / carteraBanda) * 100 : 0;
      } else {
        porcentaje =
          totalCartera > 0 ? (segmento.monto / totalCartera) * 100 : 0;
      }

      return {
        ...definition,

        monto: segmento.monto,

        carteraBanda,

        numeroPrestamos: segmento.numeroPrestamos,

        porcentaje,
      };
    });

    return {
      oficinaNumero: oficina ?? null,

      oficinaNombre: oficina ? (sucursal?.R11Nom ?? oficina) : 'Global',

      productoId: input.productoId ?? null,

      productoNombre: productoNombre ?? 'Todos los productos',

      productoCategoria,

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      totalCartera,

      numeroPrestamos,

      rangos,
    };
  }

  public async getAmortizacionesPactadas(
    input: CreditoAmortizacionesPactadasInput,
  ): Promise<CreditoAmortizacionesPactadasOutput> {
    const oficina = input.oficina?.trim() || undefined;

    let productoNombre: string | null = null;
    let productoCategoria: string | null = null;

    if (input.productoId) {
      const producto = await this.r13Producto.findFirst({
        where: {
          R13Id: input.productoId,
          R13Coop_id: input.cooperativaId,
        },
        select: {
          R13Nom: true,
          categoria: {
            select: {
              R14Nom: true,
            },
          },
        },
      });

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      productoNombre = producto.R13Nom;
      productoCategoria = producto.categoria.R14Nom;
    }

    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA01Sucursal" = ${oficina}
      `
      : Prisma.empty;

    const productoWhere = input.productoId
      ? Prisma.sql`
        AND LOWER(r."RA01Categoria") = LOWER(${productoNombre!})
        AND LOWER(r."RA01Tipo") = LOWER(${productoCategoria!})
      `
      : Prisma.empty;

    const [sucursal, segmentoRows, totalRows] = await Promise.all([
      oficina
        ? this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,
              R11NumSuc: oficina,
            },
            select: {
              R11Nom: true,
            },
          })
        : Promise.resolve(null),

      this.$queryRaw<
        {
          rango: string;
          orden: number;
          monto: Prisma.Decimal | number | bigint | string;
          numeroPrestamos: bigint | number | string;
        }[]
      >`
      SELECT
        CASE
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer = 1
            THEN '1 Pago Único'

          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 2 AND 12
            THEN '2 a 12 Pagos'

          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 13 AND 24
            THEN '13 a 24 Pagos'

          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 25 AND 36
            THEN '25 a 36 Pagos'

          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 37 AND 48
            THEN '37 a 48 Pagos'

          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 49 AND 60
            THEN '49 a 60 Pagos'

          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer >= 61
            THEN 'Más de 60 Pagos'
        END AS "rango",

        CASE
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer = 1 THEN 1
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 2 AND 12 THEN 2
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 13 AND 24 THEN 3
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 25 AND 36 THEN 4
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 37 AND 48 THEN 5
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 49 AND 60 THEN 6
          WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer >= 61 THEN 7
        END AS "orden",

        COALESCE(
          SUM(r."RA01TotalCartera"),
          0
        ) AS "monto",

        COUNT(*) AS "numeroPrestamos"

      FROM "C01ControlCarga" c

      INNER JOIN "RA01Credito" r
        ON r."RA01ControlId" = c."C01Id"

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01PeriodoMes" = ${input.periodoMes}
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01Area" = 'CREDITO'

        ${oficinaWhere}
        ${productoWhere}

        AND NULLIF(TRIM(r."RA01Abonos"), '') IS NOT NULL

      GROUP BY
        "rango",
        "orden"

      ORDER BY
        "orden";
    `,

      input.productoId
        ? this.$queryRaw<
            {
              rango: string;
              orden: number;
              monto: Prisma.Decimal | number | bigint | string;
            }[]
          >`
          SELECT
            CASE
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer = 1
                THEN '1 Pago Único'

              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 2 AND 12
                THEN '2 a 12 Pagos'

              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 13 AND 24
                THEN '13 a 24 Pagos'

              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 25 AND 36
                THEN '25 a 36 Pagos'

              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 37 AND 48
                THEN '37 a 48 Pagos'

              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 49 AND 60
                THEN '49 a 60 Pagos'

              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer >= 61
                THEN 'Más de 60 Pagos'
            END AS "rango",

            CASE
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer = 1 THEN 1
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 2 AND 12 THEN 2
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 13 AND 24 THEN 3
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 25 AND 36 THEN 4
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 37 AND 48 THEN 5
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer BETWEEN 49 AND 60 THEN 6
              WHEN NULLIF(TRIM(r."RA01Abonos"), '')::integer >= 61 THEN 7
            END AS "orden",

            COALESCE(
              SUM(r."RA01TotalCartera"),
              0
            ) AS "monto"

          FROM "C01ControlCarga" c

          INNER JOIN "RA01Credito" r
            ON r."RA01ControlId" = c."C01Id"

          WHERE
            c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
            AND c."C01PeriodoMes" = ${input.periodoMes}
            AND c."C01PeriodoAnio" = ${input.periodoAnio}
            AND c."C01Area" = 'CREDITO'

            ${oficinaWhere}

            AND NULLIF(TRIM(r."RA01Abonos"), '') IS NOT NULL

          GROUP BY
            "rango",
            "orden"

          ORDER BY
            "orden";
        `
        : Promise.resolve([]),
    ]);

    const rangoDefinitions = [
      {
        rango: '1 Pago Único',
        desde: 1,
        hasta: 1,
      },
      {
        rango: '2 a 12 Pagos',
        desde: 2,
        hasta: 12,
      },
      {
        rango: '13 a 24 Pagos',
        desde: 13,
        hasta: 24,
      },
      {
        rango: '25 a 36 Pagos',
        desde: 25,
        hasta: 36,
      },
      {
        rango: '37 a 48 Pagos',
        desde: 37,
        hasta: 48,
      },
      {
        rango: '49 a 60 Pagos',
        desde: 49,
        hasta: 60,
      },
      {
        rango: 'Más de 60 Pagos',
        desde: 61,
        hasta: null,
      },
    ];

    const segmentoMap = new Map<
      string,
      {
        monto: number;
        numeroPrestamos: number;
      }
    >(
      segmentoRows.map(
        (
          row,
        ): [
          string,
          {
            monto: number;
            numeroPrestamos: number;
          },
        ] => [
          row.rango,
          {
            monto: this._toNumber(row.monto),
            numeroPrestamos: this._toNumber(row.numeroPrestamos),
          },
        ],
      ),
    );

    const totalPorRangoMap = new Map<string, number>(
      totalRows.map((row): [string, number] => [
        row.rango,
        this._toNumber(row.monto),
      ]),
    );

    const totalCartera = Array.from(segmentoMap.values()).reduce(
      (total, row) => total + row.monto,
      0,
    );

    const numeroPrestamos = Array.from(segmentoMap.values()).reduce(
      (total, row) => total + row.numeroPrestamos,
      0,
    );

    const rangos = rangoDefinitions.map((definition) => {
      const segmento = segmentoMap.get(definition.rango) ?? {
        monto: 0,
        numeroPrestamos: 0,
      };

      const carteraBanda = input.productoId
        ? (totalPorRangoMap.get(definition.rango) ?? 0)
        : segmento.monto;

      let porcentaje = 0;

      if (input.productoId) {
        porcentaje =
          carteraBanda > 0 ? (segmento.monto / carteraBanda) * 100 : 0;
      } else {
        porcentaje =
          totalCartera > 0 ? (segmento.monto / totalCartera) * 100 : 0;
      }

      return {
        ...definition,

        monto: segmento.monto,

        carteraBanda,

        numeroPrestamos: segmento.numeroPrestamos,

        porcentaje,
      };
    });

    return {
      oficinaNumero: oficina ?? null,

      oficinaNombre: oficina ? (sucursal?.R11Nom ?? oficina) : 'Global',

      productoId: input.productoId ?? null,

      productoNombre: productoNombre ?? 'Todos los productos',

      productoCategoria,

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      totalCartera,

      numeroPrestamos,

      rangos,
    };
  }

  public async getAmortizacionesVencidas(
    input: CreditoAmortizacionesVencidasInput,
  ): Promise<CreditoAmortizacionesVencidasOutput> {
    const rangoDefinitions = [
      {
        rango: '0_VENCIDAS',
        desde: 0,
        hasta: 0,
      },
      {
        rango: '1_3_VENCIDAS',
        desde: 1,
        hasta: 3,
      },
      {
        rango: '4_6_VENCIDAS',
        desde: 4,
        hasta: 6,
      },
      {
        rango: '7_12_VENCIDAS',
        desde: 7,
        hasta: 12,
      },
      {
        rango: '13_24_VENCIDAS',
        desde: 13,
        hasta: 24,
      },
      {
        rango: '25_36_VENCIDAS',
        desde: 25,
        hasta: 36,
      },
      {
        rango: '37_MAS_VENCIDAS',
        desde: 37,
        hasta: null,
      },
    ] as const;

    let productoNombre: string | null = null;
    let productoCategoria: string | null = null;

    if (input.productoId) {
      const producto = await this.r13Producto.findFirst({
        where: {
          R13Id: input.productoId,
          R13Coop_id: input.cooperativaId,
          R13Activ: true,
        },
        select: {
          R13Nom: true,
          categoria: {
            select: {
              R14Nom: true,
            },
          },
        },
      });

      if (!producto) {
        throw new NotFoundException(
          'El producto seleccionado no existe para la cooperativa.',
        );
      }

      productoNombre = producto.R13Nom;
      productoCategoria = producto.categoria.R14Nom;
    }

    const oficinaFilter = input.oficina
      ? Prisma.sql`
        AND r."RA01Sucursal" = ${input.oficina}
      `
      : Prisma.empty;

    const productoFilter =
      productoNombre && productoCategoria
        ? Prisma.sql`
          AND LOWER(TRIM(r."RA01Categoria")) =
              LOWER(TRIM(${productoNombre}))
          AND LOWER(TRIM(r."RA01Tipo")) =
              LOWER(TRIM(${productoCategoria}))
        `
        : Prisma.empty;

    const [sucursal, segmentoRows, totalRows] = await Promise.all([
      input.oficina
        ? this.r11Sucursal.findFirst({
            where: {
              R11Coop_id: input.cooperativaId,
              R11NumSuc: input.oficina,
            },
            select: {
              R11Nom: true,
            },
          })
        : Promise.resolve(null),

      this.$queryRaw<
        Array<{
          rango: string;
          monto: string | number | bigint | Prisma.Decimal | null;
          numeroPrestamos: bigint;
        }>
      >(Prisma.sql`
        SELECT
          CASE
            WHEN r."RA01AbonosVencidos" = 0
              THEN '0_VENCIDAS'

            WHEN r."RA01AbonosVencidos"
              BETWEEN 1 AND 3
              THEN '1_3_VENCIDAS'

            WHEN r."RA01AbonosVencidos"
              BETWEEN 4 AND 6
              THEN '4_6_VENCIDAS'

            WHEN r."RA01AbonosVencidos"
              BETWEEN 7 AND 12
              THEN '7_12_VENCIDAS'

            WHEN r."RA01AbonosVencidos"
              BETWEEN 13 AND 24
              THEN '13_24_VENCIDAS'

            WHEN r."RA01AbonosVencidos"
              BETWEEN 25 AND 36
              THEN '25_36_VENCIDAS'

            WHEN r."RA01AbonosVencidos" >= 37
              THEN '37_MAS_VENCIDAS'
          END AS rango,

          COALESCE(
            SUM(r."RA01TotalCartera"),
            0
          ) AS monto,

          COUNT(*) AS "numeroPrestamos"

        FROM "RA01Credito" r

        INNER JOIN "C01ControlCarga" c
          ON c."C01Id" =
             r."RA01ControlId"

        WHERE
          c."C01CooperativaCodigo" =
            ${input.cooperativaId}::uuid

          AND c."C01PeriodoMes" =
            ${input.periodoMes}

          AND c."C01PeriodoAnio" =
            ${input.periodoAnio}

          AND c."C01Area" =
            'CREDITO'

          ${oficinaFilter}

          ${productoFilter}

        GROUP BY rango
      `),

      input.productoId
        ? this.$queryRaw<
            Array<{
              rango: string;
              monto: string | number | bigint | Prisma.Decimal | null;
            }>
          >(Prisma.sql`
            SELECT
              CASE
                WHEN r."RA01AbonosVencidos" = 0
                  THEN '0_VENCIDAS'

                WHEN r."RA01AbonosVencidos"
                  BETWEEN 1 AND 3
                  THEN '1_3_VENCIDAS'

                WHEN r."RA01AbonosVencidos"
                  BETWEEN 4 AND 6
                  THEN '4_6_VENCIDAS'

                WHEN r."RA01AbonosVencidos"
                  BETWEEN 7 AND 12
                  THEN '7_12_VENCIDAS'

                WHEN r."RA01AbonosVencidos"
                  BETWEEN 13 AND 24
                  THEN '13_24_VENCIDAS'

                WHEN r."RA01AbonosVencidos"
                  BETWEEN 25 AND 36
                  THEN '25_36_VENCIDAS'

                WHEN r."RA01AbonosVencidos" >= 37
                  THEN '37_MAS_VENCIDAS'
              END AS rango,

              COALESCE(
                SUM(r."RA01TotalCartera"),
                0
              ) AS monto

            FROM "RA01Credito" r

            INNER JOIN "C01ControlCarga" c
              ON c."C01Id" =
                 r."RA01ControlId"

            WHERE
              c."C01CooperativaCodigo" =
                ${input.cooperativaId}::uuid

              AND c."C01PeriodoMes" =
                ${input.periodoMes}

              AND c."C01PeriodoAnio" =
                ${input.periodoAnio}

              AND c."C01Area" =
                'CREDITO'

              ${oficinaFilter}

            GROUP BY rango
          `)
        : Promise.resolve([]),
    ]);

    const segmentoMap = new Map<
      string,
      {
        monto: number;
        numeroPrestamos: number;
      }
    >(
      segmentoRows.map(
        (
          row,
        ): [
          string,
          {
            monto: number;
            numeroPrestamos: number;
          },
        ] => [
          row.rango,
          {
            monto: this._toNumber(row.monto),
            numeroPrestamos: Number(row.numeroPrestamos),
          },
        ],
      ),
    );

    const totalPorRangoMap = new Map<string, number>(
      totalRows.map((row): [string, number] => [
        row.rango,
        this._toNumber(row.monto),
      ]),
    );

    const totalCartera = Array.from(segmentoMap.values()).reduce(
      (acumulado, item) => acumulado + item.monto,
      0,
    );

    const numeroPrestamos = Array.from(segmentoMap.values()).reduce(
      (acumulado, item) => acumulado + item.numeroPrestamos,
      0,
    );

    const rangos = rangoDefinitions.map((definition) => {
      const segmento = segmentoMap.get(definition.rango) ?? {
        monto: 0,
        numeroPrestamos: 0,
      };

      const carteraBanda = input.productoId
        ? (totalPorRangoMap.get(definition.rango) ?? 0)
        : segmento.monto;

      let porcentaje = 0;

      if (input.productoId) {
        porcentaje =
          carteraBanda > 0 ? (segmento.monto / carteraBanda) * 100 : 0;
      } else {
        porcentaje =
          totalCartera > 0 ? (segmento.monto / totalCartera) * 100 : 0;
      }

      return {
        ...definition,

        monto: segmento.monto,

        carteraBanda,

        numeroPrestamos: segmento.numeroPrestamos,

        porcentaje,
      };
    });

    return {
      oficinaNumero: input.oficina ?? null,

      oficinaNombre: input.oficina
        ? (sucursal?.R11Nom ?? input.oficina)
        : 'Global',

      productoId: input.productoId ?? null,

      productoNombre: productoNombre ?? 'Todos los productos',

      productoCategoria,

      periodoMes: input.periodoMes,

      periodoAnio: input.periodoAnio,

      totalCartera,

      numeroPrestamos,

      rangos,
    };
  }

  //   ==================================
  //   HELPERS
  //   ==================================

  private async _getHeader(input: CreditoColocacionTotalInput) {
    const baseWhere = this._buildBaseWhere(input);

    const oficinaCondition = input.oficina
      ? Prisma.sql`r."RA01Sucursal" = ${input.oficina}`
      : Prisma.sql`TRUE`;

    const [row] = await this.$queryRaw<
      {
        capitalDesembolsado: bigint;
        numeroPrestamos: bigint;
        totalCooperativa: bigint;
        oficinaConsultada: string | null;
      }[]
    >`
      SELECT
        COALESCE(
          SUM(r."RA01CEntregada") FILTER (WHERE ${oficinaCondition}),
          0
        )::bigint AS "capitalDesembolsado",

        COUNT(*) FILTER (WHERE ${oficinaCondition})::bigint AS "numeroPrestamos",

        COALESCE(
          SUM(r."RA01CEntregada"),
          0
        )::bigint AS "totalCooperativa",

        ${
          input.oficina
            ? Prisma.sql`
              COALESCE(
                MAX(s."R11Nom") FILTER (WHERE ${oficinaCondition}),
                'Sucursal desconocida'
              )
            `
            : Prisma.sql`${CreditoService.OFICINA_GLOBAL}`
        } AS "oficinaConsultada"

      FROM "RA01Credito" r
             INNER JOIN "C01ControlCarga" c
                        ON c."C01Id" = r."RA01ControlId"
             LEFT JOIN "R11Sucursal" s
                       ON s."R11NumSuc" = r."RA01Sucursal"
                         AND s."R11Coop_id" = c."C01CooperativaCodigo"
      WHERE ${baseWhere}
    `;

    const capitalDesembolsado = Number(row?.capitalDesembolsado ?? 0);
    const numeroPrestamos = Number(row?.numeroPrestamos ?? 0);
    const totalCooperativa = Number(row?.totalCooperativa ?? 0);

    return {
      oficinaCodigo: input.oficina ?? null,
      oficinaConsultada:
        row?.oficinaConsultada ?? CreditoService.OFICINA_GLOBAL,
      cifrasPor: input.evaluacion,
      informe: input.informe,
      capitalDesembolsado,
      numeroPrestamos,
      participacionPorcentaje:
        totalCooperativa > 0
          ? Number(((capitalDesembolsado / totalCooperativa) * 100).toFixed(2))
          : 0,
    };
  }

  private _buildBaseWhere(input: CreditoColocacionTotalInput): Prisma.Sql {
    if (input.informe === CreditoInformeEnum.MENSUAL) {
      const { startDate, endDate } = getMonthDateRange(
        input.periodoMes,
        input.periodoAnio,
      );

      return Prisma.sql`
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01PeriodoMes" = ${input.periodoMes}
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01Area" = 'CREDITO'
        AND TO_DATE(r."RA01FEntrega", 'YYYY-MM-DD') >= ${startDate}::date
        AND TO_DATE(r."RA01FEntrega", 'YYYY-MM-DD') < ${endDate}::date
      `;
    }

    return Prisma.sql`
      c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
      AND c."C01PeriodoMes" = ${input.periodoMes}
      AND c."C01PeriodoAnio" = ${input.periodoAnio}
      AND c."C01Area" = 'CREDITO'
    `;
  }

  private async _getTablaSucursalMes(input: CreditoColocacionTotalInput) {
    const oficinaFilter = input.oficina
      ? Prisma.sql`AND r."RA01Sucursal" = ${input.oficina}`
      : Prisma.empty;

    const mensualFilter =
      input.informe === CreditoInformeEnum.MENSUAL
        ? this._buildMensualFilter()
        : Prisma.empty;

    return this.$queryRaw<
      {
        sucursalCodigo: string;
        sucursalNombre: string;
        enero: number;
        febrero: number;
        marzo: number;
        abril: number;
        mayo: number;
        junio: number;
        julio: number;
        agosto: number;
        septiembre: number;
        octubre: number;
        noviembre: number;
        diciembre: number;
        total: number;
      }[]
    >`
      SELECT
        r."RA01Sucursal" AS "sucursalCodigo",
        COALESCE(s."R11Nom", 'Sucursal desconocida') AS "sucursalNombre",
  
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 1), 0)::float AS "enero",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 2), 0)::float AS "febrero",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 3), 0)::float AS "marzo",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 4), 0)::float AS "abril",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 5), 0)::float AS "mayo",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 6), 0)::float AS "junio",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 7), 0)::float AS "julio",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 8), 0)::float AS "agosto",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 9), 0)::float AS "septiembre",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 10), 0)::float AS "octubre",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 11), 0)::float AS "noviembre",
        COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 12), 0)::float AS "diciembre",
  
        ${
          input.informe === CreditoInformeEnum.MENSUAL
            ? Prisma.sql`COALESCE(SUM(r."RA01CEntregada"), 0)::float`
            : Prisma.sql`0::float`
        } AS "total"
  
      FROM "RA01Credito" r
      INNER JOIN "C01ControlCarga" c
        ON c."C01Id" = r."RA01ControlId"
      LEFT JOIN "R11Sucursal" s
        ON s."R11NumSuc" = r."RA01Sucursal"
        AND s."R11Coop_id" = c."C01CooperativaCodigo"
  
      WHERE c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01PeriodoMes" <= ${input.periodoMes}
        AND c."C01Area" = 'CREDITO'
        ${oficinaFilter}
        ${mensualFilter}
  
      GROUP BY
        r."RA01Sucursal",
        s."R11Nom"
  
      ORDER BY
          CASE
          WHEN r."RA01Sucursal" ~ '^[0-9]+$' THEN r."RA01Sucursal"::int
          ELSE 999999
        END ASC,
      r."RA01Sucursal" ASC;
    `;
  }

  private async _getTablaSucursalMesTotales(
    input: CreditoColocacionTotalInput,
  ) {
    const mensualFilter =
      input.informe === CreditoInformeEnum.MENSUAL
        ? this._buildMensualFilter()
        : Prisma.empty;

    const [row] = await this.$queryRaw<
      {
        enero: number;
        febrero: number;
        marzo: number;
        abril: number;
        mayo: number;
        junio: number;
        julio: number;
        agosto: number;
        septiembre: number;
        octubre: number;
        noviembre: number;
        diciembre: number;
        total: number;
      }[]
    >`
    SELECT
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 1), 0)::float AS "enero",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 2), 0)::float AS "febrero",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 3), 0)::float AS "marzo",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 4), 0)::float AS "abril",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 5), 0)::float AS "mayo",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 6), 0)::float AS "junio",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 7), 0)::float AS "julio",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 8), 0)::float AS "agosto",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 9), 0)::float AS "septiembre",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 10), 0)::float AS "octubre",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 11), 0)::float AS "noviembre",
      COALESCE(SUM(r."RA01CEntregada") FILTER (WHERE c."C01PeriodoMes" = 12), 0)::float AS "diciembre",

      ${
        input.informe === CreditoInformeEnum.MENSUAL
          ? Prisma.sql`COALESCE(SUM(r."RA01CEntregada"), 0)::float`
          : Prisma.sql`0::float`
      } AS "total"

    FROM "RA01Credito" r
    INNER JOIN "C01ControlCarga" c
      ON c."C01Id" = r."RA01ControlId"

    WHERE c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
      AND c."C01PeriodoAnio" = ${input.periodoAnio}
      AND c."C01PeriodoMes" <= ${input.periodoMes}
      AND c."C01Area" = 'CREDITO'
      ${mensualFilter};
  `;

    return (
      row ?? {
        enero: 0,
        febrero: 0,
        marzo: 0,
        abril: 0,
        mayo: 0,
        junio: 0,
        julio: 0,
        agosto: 0,
        septiembre: 0,
        octubre: 0,
        noviembre: 0,
        diciembre: 0,
        total: 0,
      }
    );
  }

  private async _getGraficaSucursal(input: CreditoColocacionTotalInput) {
    const mensualFilter =
      input.informe === CreditoInformeEnum.MENSUAL
        ? this._buildMensualFilter()
        : Prisma.empty;

    return this.$queryRaw<
      {
        label: string;
        monto: number;
        numeroPrestamos: number;
        participacionPorcentaje: number;
      }[]
    >`
      WITH base AS (
        SELECT
          COALESCE(s."R11Nom", 'Sucursal desconocida') AS "label",
          r."RA01CEntregada" AS "monto"
        FROM "RA01Credito" r
        INNER JOIN "C01ControlCarga" c
          ON c."C01Id" = r."RA01ControlId"
        LEFT JOIN "R11Sucursal" s
          ON s."R11NumSuc" = r."RA01Sucursal"
          AND s."R11Coop_id" = c."C01CooperativaCodigo"
        WHERE c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
          AND c."C01PeriodoAnio" = ${input.periodoAnio}
          AND c."C01PeriodoMes" = ${input.periodoMes}
          AND c."C01Area" = 'CREDITO'
          ${mensualFilter}
      ),
      total AS (
        SELECT COALESCE(SUM("monto"), 0)::float AS "totalMonto"
        FROM base
      )
      SELECT
        b."label",
        COALESCE(SUM(b."monto"), 0)::float AS "monto",
        COUNT(*)::int AS "numeroPrestamos",
        CASE
          WHEN t."totalMonto" > 0
          THEN ROUND(((SUM(b."monto")::numeric / t."totalMonto"::numeric) * 100), 2)::float
          ELSE 0
        END AS "participacionPorcentaje"
      FROM base b
      CROSS JOIN total t
      GROUP BY
        b."label",
        t."totalMonto"
      ORDER BY
        SUM(b."monto") DESC;
    `;
  }

  private async _getGraficaEvaluacion(input: CreditoColocacionTotalInput) {
    const evaluacionColumn = Prisma.raw(
      `"${getCreditoEvaluacionColumn(input.evaluacion)}"`,
    );
    const baseWhere = this._buildBaseWhere(input);

    const oficinaFilter = input.oficina
      ? Prisma.sql`AND r."RA01Sucursal" = ${input.oficina}`
      : Prisma.empty;

    return this.$queryRaw<
      {
        label: string;
        monto: number;
        numeroPrestamos: number;
        participacionPorcentaje: number;
      }[]
    >`
      WITH base AS (
        SELECT
          COALESCE(NULLIF((r.${evaluacionColumn})::text, ''), 'Sin dato') AS "label",
          r."RA01CEntregada" AS "monto"
        FROM "RA01Credito" r
        INNER JOIN "C01ControlCarga" c
          ON c."C01Id" = r."RA01ControlId"
        WHERE ${baseWhere}
          ${oficinaFilter}
      ),
      total AS (
        SELECT COALESCE(SUM("monto"), 0)::float AS "totalMonto"
        FROM base
      )
      SELECT
        b."label",
        COALESCE(SUM(b."monto"), 0)::float AS "monto",
        COUNT(*)::int AS "numeroPrestamos",
        CASE
          WHEN t."totalMonto" > 0
          THEN ROUND(((SUM(b."monto")::numeric / t."totalMonto"::numeric) * 100), 2)::float
          ELSE 0
        END AS "participacionPorcentaje"
      FROM base b
      CROSS JOIN total t
      GROUP BY
        b."label",
        t."totalMonto"
      ORDER BY
        SUM(b."monto") DESC;
    `;
  }

  private async _getMayorDemandaItem(
    input: CreditoColocacionTotalInput,
    column: Prisma.Sql,
  ) {
    const baseWhere = this._buildBaseWhere(input);

    const oficinaFilter = input.oficina
      ? Prisma.sql`AND r."RA01Sucursal" = ${input.oficina}`
      : Prisma.empty;

    const [row] = await this.$queryRaw<
      {
        label: string;
        monto: number;
        participacionPorcentaje: number;
      }[]
    >`
    WITH base AS (
      SELECT
        COALESCE(NULLIF((${column})::text, ''), 'Sin dato') AS "label",
        r."RA01CEntregada" AS "monto"
      FROM "RA01Credito" r
      INNER JOIN "C01ControlCarga" c
        ON c."C01Id" = r."RA01ControlId"
      WHERE ${baseWhere}
        ${oficinaFilter}
    ),
    total AS (
      SELECT COALESCE(SUM("monto"), 0)::float AS "totalMonto"
      FROM base
    )
    SELECT
      b."label",
      COALESCE(SUM(b."monto"), 0)::float AS "monto",
      CASE
        WHEN t."totalMonto" > 0
        THEN ROUND(((SUM(b."monto")::numeric / t."totalMonto"::numeric) * 100), 2)::float
        ELSE 0
      END AS "participacionPorcentaje"
    FROM base b
    CROSS JOIN total t
    GROUP BY
      b."label",
      t."totalMonto"
    ORDER BY
      SUM(b."monto") DESC
    LIMIT 1;
  `;

    return (
      row ?? {
        label: 'Sin dato',
        monto: 0,
        participacionPorcentaje: 0,
      }
    );
  }

  private async _getMayorDemanda(input: CreditoColocacionTotalInput) {
    const [producto, tasa, finalidad, destinoAgro] = await Promise.all([
      this._getMayorDemandaItem(input, Prisma.sql`r."RA01Categoria"`),
      this._getMayorDemandaItem(input, Prisma.sql`r."RA01TasaOrdinaria"`),
      this._getMayorDemandaItem(input, Prisma.sql`r."RA01Finalidad"`),
      this._getMayorDemandaItem(input, Prisma.sql`r."RA01DestinoAgropecuario"`),
    ]);

    return {
      producto,
      tasa,
      finalidad,
      destinoAgro,
    };
  }

  private _buildMensualFilter(): Prisma.Sql {
    return Prisma.sql`
      AND TO_DATE(r."RA01FEntrega", 'YYYY-MM-DD') >= MAKE_DATE(c."C01PeriodoAnio", c."C01PeriodoMes", 1)
      AND TO_DATE(r."RA01FEntrega", 'YYYY-MM-DD') <  MAKE_DATE(c."C01PeriodoAnio", c."C01PeriodoMes", 1) + INTERVAL '1 month'
    `;
  }

  /**
   * Obtiene el primer día del mes siguiente en formato YYYY-MM-DD.
   */
  private _getNextMonthDate(year: number, month: number): string {
    if (month === 12) {
      return `${year + 1}-01-01`;
    }

    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  }

  /**
   * Calcula un porcentaje y lo redondea a dos decimales.
   */
  private _toPercentage(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return Number(((value / total) * 100).toFixed(2));
  }

  /**
   * Convierte valores numéricos provenientes de Prisma/PostgreSQL a number.
   */
  private _toNumber(
    value: Prisma.Decimal | bigint | number | string | null | undefined,
  ): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (value instanceof Prisma.Decimal) {
      return value.toNumber();
    }

    return Number(value);
  }

  private _getQuarter(month: number): {
    numeroTrimestre: number;
    mesInicio: number;
    mesFin: number;
  } {
    const numeroTrimestre = Math.ceil(month / 3);

    const mesInicio = (numeroTrimestre - 1) * 3 + 1;

    return {
      numeroTrimestre,
      mesInicio,
      mesFin: mesInicio + 2,
    };
  }

  private _normalizeSucursal(value: string): string {
    return value.trim();
  }

  private async _getFortalezaProductos(params: {
    cooperativaId: string;
    periodoMes: number;
    periodoAnio: number;
    oficina?: string;
    enfoque: CreditoFortalezaEnfoque;
  }): Promise<FortalezaProductoRow[]> {
    const { cooperativaId, periodoMes, periodoAnio, oficina, enfoque } = params;

    const meses =
      enfoque === CreditoFortalezaEnfoque.MENSUAL
        ? [periodoMes]
        : Array.from({ length: periodoMes }, (_, index) => index + 1);

    const controles = await this.c01ControlCarga.findMany({
      where: {
        C01CooperativaCodigo: cooperativaId,
        C01PeriodoAnio: periodoAnio,
        C01PeriodoMes: {
          in: meses,
        },
        C01Area: 'CREDITO',
      },
      select: {
        C01Id: true,
        C01PeriodoMes: true,
      },
    });

    const controlPorMes = new Map<number, number>();

    for (const control of controles) {
      controlPorMes.set(control.C01PeriodoMes, control.C01Id);
    }

    const oficinaCondition =
      oficina !== undefined
        ? Prisma.sql`
          AND r."RA01Sucursal" = ${oficina}
        `
        : Prisma.empty;

    const resultados = await Promise.all(
      meses.map(async (mes) => {
        const controlId = controlPorMes.get(mes);

        if (!controlId) {
          return [] as FortalezaProductoRow[];
        }

        const fechaInicio = `${periodoAnio}-${String(mes).padStart(2, '0')}-01`;

        const fechaFin = this._getNextMonthDate(periodoAnio, mes);

        const rows = await this.$queryRaw<
          {
            productoNombre: string | null;
            colocacion: Prisma.Decimal | number | bigint | string;
            prestamos: number | bigint | string;
          }[]
        >`
        SELECT
          r."RA01Categoria" AS "productoNombre",

          COALESCE(
            SUM(r."RA01CEntregada"),
            0
          ) AS "colocacion",

          COUNT(*) AS "prestamos"

        FROM "RA01Credito" r

        WHERE
          r."RA01ControlId" = ${controlId}

          AND r."RA01FEntrega" >= ${fechaInicio}

          AND r."RA01FEntrega" < ${fechaFin}

          ${oficinaCondition}

        GROUP BY
          r."RA01Categoria";
      `;

        return rows.map((row) => ({
          productoNombre: row.productoNombre?.trim() || 'Sin categoría',

          colocacion: this._toNumber(row.colocacion),

          prestamos: this._toNumber(row.prestamos),
        }));
      }),
    );

    const acumuladoPorProducto = new Map<string, FortalezaProductoRow>();

    for (const grupoMensual of resultados) {
      for (const row of grupoMensual) {
        const existente = acumuladoPorProducto.get(row.productoNombre);

        if (existente) {
          existente.colocacion += row.colocacion;

          existente.prestamos += row.prestamos;
        } else {
          acumuladoPorProducto.set(row.productoNombre, {
            ...row,
          });
        }
      }
    }

    return [...acumuladoPorProducto.values()];
  }

  private _buildFortalezaResultado(
    productos: FortalezaProductoRow[],
  ): FortalezaResultado {
    const totalColocacion = productos.reduce(
      (total, producto) => total + producto.colocacion,
      0,
    );

    const totalPrestamos = productos.reduce(
      (total, producto) => total + producto.prestamos,
      0,
    );

    const getPorcentaje = (colocacion: number): number => {
      if (totalColocacion <= 0) {
        return 0;
      }

      return (colocacion / totalColocacion) * 100;
    };

    const productosOrdenados = [...productos].sort(
      (a, b) => b.colocacion - a.colocacion,
    );

    const mayoresBase = productosOrdenados.slice(0, 5);

    const nombresMayores = new Set(
      mayoresBase.map((producto) => producto.productoNombre),
    );

    const candidatosMenores = productos
      .filter((producto) => !nombresMayores.has(producto.productoNombre))
      .sort((a, b) => a.colocacion - b.colocacion);

    const menoresBase = candidatosMenores.slice(0, 5);

    const mayores: CreditoFortalezaProductoOutput[] = mayoresBase.map(
      (producto) => ({
        productoNombre: producto.productoNombre,

        colocacion: producto.colocacion,

        prestamos: producto.prestamos,

        porcentaje: getPorcentaje(producto.colocacion),
      }),
    );

    const menores: CreditoFortalezaProductoOutput[] = menoresBase.map(
      (producto) => ({
        productoNombre: producto.productoNombre,

        colocacion: producto.colocacion,

        prestamos: producto.prestamos,

        porcentaje: getPorcentaje(producto.colocacion),
      }),
    );

    const totalMayoresColocacion = mayoresBase.reduce(
      (total, producto) => total + producto.colocacion,
      0,
    );

    const totalMayoresPrestamos = mayoresBase.reduce(
      (total, producto) => total + producto.prestamos,
      0,
    );

    const totalMenoresColocacion = menoresBase.reduce(
      (total, producto) => total + producto.colocacion,
      0,
    );

    const totalMenoresPrestamos = menoresBase.reduce(
      (total, producto) => total + producto.prestamos,
      0,
    );

    const restoColocacion =
      totalColocacion - totalMayoresColocacion - totalMenoresColocacion;

    const restoPrestamos =
      totalPrestamos - totalMayoresPrestamos - totalMenoresPrestamos;

    return {
      totalColocacion,
      totalPrestamos,

      mayores,
      menores,

      totalMayores: {
        colocacion: totalMayoresColocacion,

        prestamos: totalMayoresPrestamos,

        porcentaje: getPorcentaje(totalMayoresColocacion),
      },

      totalMenores: {
        colocacion: totalMenoresColocacion,

        prestamos: totalMenoresPrestamos,

        porcentaje: getPorcentaje(totalMenoresColocacion),
      },

      resto: {
        colocacion: restoColocacion,

        prestamos: restoPrestamos,

        porcentaje: getPorcentaje(restoColocacion),
      },
    };
  }

  private _getExtremoColocacion(
    meses: Array<{
      periodoMes: number;
      colocacion: number;
    }>,
    tipo: 'MAX' | 'MIN',
  ): CreditoComportamientoProductoExtremoOutput | null {
    if (meses.length === 0) {
      return null;
    }

    const extremo = meses.reduce((seleccionado, actual) => {
      const reemplazar =
        tipo === 'MAX'
          ? actual.colocacion > seleccionado.colocacion
          : actual.colocacion < seleccionado.colocacion;

      return reemplazar ? actual : seleccionado;
    });

    return {
      periodoMes: extremo.periodoMes,

      colocacion: extremo.colocacion,
    };
  }
}
