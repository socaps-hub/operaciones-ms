import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

      const fechaInicio =
        `${input.periodoAnio}-${String(input.periodoMes).padStart(2, '0')}-01`;

      const fechaFin = this._getNextMonthDate(
        input.periodoAnio,
        input.periodoMes,
      );

      const [
        [metaRow],
        [colocacionRow],
        sucursal,
      ] = await Promise.all([
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
            realColocado:
              | Prisma.Decimal
              | number
              | bigint
              | string;

            numeroPrestamos:
              | number
              | bigint;
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

      const metaMes =
        this._toNumber(metaRow?.metaMes);

      const realColocado =
        this._toNumber(colocacionRow?.realColocado);

      const numeroPrestamos =
        this._toNumber(colocacionRow?.numeroPrestamos);

      const cumplimientoPorcentaje =
        metaMes > 0
          ? this._toPercentage(
            realColocado,
            metaMes,
          )
          : 0;

      const faltante =
        realColocado - metaMes;

      return {
        oficinaNombre:
          input.oficina
            ? sucursal?.R11Nom ?? 'Sucursal desconocida'
            : 'Global',

        periodoMes: input.periodoMes,
        periodoAnio: input.periodoAnio,

        metaMes,

        realColocado,

        cumplimientoPorcentaje,

        faltante,

        numeroPrestamos,

        cumplioMeta:
          metaMes > 0 &&
          realColocado >= metaMes,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al obtener la medición mensual de crédito.';

      this._logger.error(
        `Error en medición mensual de crédito: ${message}`,
      );

      throw new RpcException({
        message,
        status: HttpStatus.BAD_REQUEST,
      });
    }
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
}
