import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { CreditoColocacionTotalInput } from './dto/inputs/credito-colocacion-total.input';
import { CreditoColocacionTotalOutput } from './dto/outputs/credito-colocacion-total.output';
import { CreditoInformeEnum } from './enums/credito-dashboard.enum';
import { getMonthDateRange } from './utils/credito-date.util';
import { getCreditoEvaluacionColumn } from './utils/credito-evaluacion-column.util';

@Injectable()
export class CreditoService extends PrismaClient implements OnModuleInit {
  private readonly _logger = new Logger('CreditoService');
  private static readonly OFICINA_GLOBAL = 'Global';

  async onModuleInit() {
    await this.$connect();
    this._logger.log('Database connected');
  }

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
}
