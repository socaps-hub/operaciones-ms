import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma, PrismaClient } from '@prisma/client';

import { GetControlesMetasInput } from './dto/inputs/get-controles-metas.input';
import { ControlMetaOutput } from './dto/outputs/control-meta.output';
import { OpMetaAreaEnum } from '../common/enums/op-meta-area.enum';
import { GetDetalleMetaInput } from './dto/inputs/get-detalle-meta.input';
import { DetalleMetaOutput } from './dto/outputs/detalle-meta.output';
import { DetalleMetaSucursalOutput } from './dto/outputs/detalle-meta-sucursal.output';
import { DetalleMetaTotalesOutput } from './dto/outputs/detalle-meta-totales.output';

type MetaMontosRow = {
  enero: Prisma.Decimal;
  febrero: Prisma.Decimal;
  marzo: Prisma.Decimal;
  abril: Prisma.Decimal;
  mayo: Prisma.Decimal;
  junio: Prisma.Decimal;
  julio: Prisma.Decimal;
  agosto: Prisma.Decimal;
  septiembre: Prisma.Decimal;
  octubre: Prisma.Decimal;
  noviembre: Prisma.Decimal;
  diciembre: Prisma.Decimal;
  total: Prisma.Decimal;
};

type DetalleMetaRow = MetaMontosRow & {
  sucursalNumero: string;
  sucursalNombre: string;
};

@Injectable()
export class MetasService extends PrismaClient implements OnModuleInit {
  private readonly _logger = new Logger('MetasService');

  async onModuleInit() {
    await this.$connect();
    this._logger.log('Database connected');
  }

  public async getControlesMetas(
    input: GetControlesMetasInput,
  ): Promise<ControlMetaOutput[]> {
    const rows = await this.oP00ControlMetaColocacion.findMany({
      where: {
        ...(input.cooperativaId && {
          OP00CooperativaCodigo: input.cooperativaId,
        }),
        ...(input.area && {
          OP00Area: input.area,
        }),
        ...(input.periodoAnio && {
          OP00PeriodoAnio: input.periodoAnio,
        }),
      },
      orderBy: [
        {
          OP00PeriodoAnio: 'desc',
        },
        {
          OP00FechaCarga: 'desc',
        },
      ],
      select: {
        OP00Id: true,
        OP00CooperativaCodigo: true,
        OP00Area: true,
        OP00PeriodoAnio: true,
        OP00Archivo: true,
        OP00FechaCarga: true,

        metas: {
          select: {
            OP01SucursalNumero: true,
          },
        },
      },
    });

    if (!rows.length) {
      return [];
    }

    const cooperativaIds = [
      ...new Set(rows.map((row) => row.OP00CooperativaCodigo)),
    ];

    const cooperativas = await this.r17Cooperativas.findMany({
      where: {
        R17Id: {
          in: cooperativaIds,
        },
      },
      select: {
        R17Id: true,
        R17Nom: true,
      },
    });

    const cooperativasMap = new Map(
      cooperativas.map((cooperativa) => [
        cooperativa.R17Id,
        cooperativa.R17Nom,
      ]),
    );

    return rows.map((row) => {
      const sucursales = new Set(
        row.metas.map((meta) => meta.OP01SucursalNumero),
      ).size;

      return {
        controlId: row.OP00Id,
        cooperativaId: row.OP00CooperativaCodigo,
        cooperativaNombre:
          cooperativasMap.get(row.OP00CooperativaCodigo) ??
          'Cooperativa desconocida',
        area: row.OP00Area.toUpperCase() as OpMetaAreaEnum,
        periodoAnio: row.OP00PeriodoAnio,
        archivo: row.OP00Archivo,

        // Convertir Date de Prisma a string antes de salir del microservicio.
        fechaCarga: row.OP00FechaCarga.toISOString(),

        sucursales,
        metasRegistradas: row.metas.length,
      };
    });
  }

  public async getDetalleMeta(
    input: GetDetalleMetaInput,
  ): Promise<DetalleMetaOutput> {
    const control = await this.oP00ControlMetaColocacion.findUnique({
      where: {
        OP00Id: input.controlId,
      },
      select: {
        OP00Id: true,
        OP00CooperativaCodigo: true,
        OP00Area: true,
        OP00PeriodoAnio: true,
      },
    });

    if (!control) {
      throw new RpcException({
        message: 'No se encontró el control de metas solicitado.',
        status: HttpStatus.NOT_FOUND,
      });
    }

    const [filas, [totalesRow], cooperativa] = await Promise.all([
      this.$queryRaw<DetalleMetaRow[]>`
        SELECT
          m."OP01SucursalNumero" AS "sucursalNumero",

          COALESCE(
            s."R11Nom",
            'Sucursal desconocida'
          ) AS "sucursalNombre",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 1
          ),
            0
          ) AS "enero",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 2
          ),
            0
          ) AS "febrero",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 3
          ),
            0
          ) AS "marzo",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 4
          ),
            0
          ) AS "abril",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 5
          ),
            0
          ) AS "mayo",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 6
          ),
            0
          ) AS "junio",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 7
          ),
            0
          ) AS "julio",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 8
          ),
            0
          ) AS "agosto",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 9
          ),
            0
          ) AS "septiembre",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 10
          ),
            0
          ) AS "octubre",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 11
          ),
            0
          ) AS "noviembre",

          COALESCE(
            SUM(m."OP01Meta") FILTER (
            WHERE m."OP01PeriodoMes" = 12
          ),
            0
          ) AS "diciembre",

          COALESCE(
            SUM(m."OP01Meta"),
            0
          ) AS "total"

        FROM "OP01MetaColocacion" m

               LEFT JOIN "R11Sucursal" s
                         ON s."R11NumSuc" = m."OP01SucursalNumero"
                           AND s."R11Coop_id" = ${control.OP00CooperativaCodigo}::uuid

        WHERE m."OP01ControlId" = ${control.OP00Id}

        GROUP BY
          m."OP01SucursalNumero",
          s."R11Nom"

        ORDER BY
          m."OP01SucursalNumero";
      `,

      this.$queryRaw<MetaMontosRow[]>`
        SELECT
          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 1
          ),
            0
          ) AS "enero",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 2
          ),
            0
          ) AS "febrero",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 3
          ),
            0
          ) AS "marzo",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 4
          ),
            0
          ) AS "abril",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 5
          ),
            0
          ) AS "mayo",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 6
          ),
            0
          ) AS "junio",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 7
          ),
            0
          ) AS "julio",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 8
          ),
            0
          ) AS "agosto",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 9
          ),
            0
          ) AS "septiembre",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 10
          ),
            0
          ) AS "octubre",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 11
          ),
            0
          ) AS "noviembre",

          COALESCE(
            SUM("OP01Meta") FILTER (
            WHERE "OP01PeriodoMes" = 12
          ),
            0
          ) AS "diciembre",

          COALESCE(
            SUM("OP01Meta"),
            0
          ) AS "total"

        FROM "OP01MetaColocacion"

        WHERE "OP01ControlId" = ${control.OP00Id};
      `,

      this.r17Cooperativas.findUnique({
        where: {
          R17Id: control.OP00CooperativaCodigo,
        },
        select: {
          R17Nom: true,
        },
      }),
    ]);

    const mappedFilas: DetalleMetaSucursalOutput[] = filas.map((row) => ({
      sucursalNumero: row.sucursalNumero,
      sucursalNombre: row.sucursalNombre,

      enero: row.enero.toNumber(),
      febrero: row.febrero.toNumber(),
      marzo: row.marzo.toNumber(),
      abril: row.abril.toNumber(),
      mayo: row.mayo.toNumber(),
      junio: row.junio.toNumber(),
      julio: row.julio.toNumber(),
      agosto: row.agosto.toNumber(),
      septiembre: row.septiembre.toNumber(),
      octubre: row.octubre.toNumber(),
      noviembre: row.noviembre.toNumber(),
      diciembre: row.diciembre.toNumber(),

      total: row.total.toNumber(),
    }));

    const totales: DetalleMetaTotalesOutput = {
      enero: totalesRow?.enero.toNumber() ?? 0,
      febrero: totalesRow?.febrero.toNumber() ?? 0,
      marzo: totalesRow?.marzo.toNumber() ?? 0,
      abril: totalesRow?.abril.toNumber() ?? 0,
      mayo: totalesRow?.mayo.toNumber() ?? 0,
      junio: totalesRow?.junio.toNumber() ?? 0,
      julio: totalesRow?.julio.toNumber() ?? 0,
      agosto: totalesRow?.agosto.toNumber() ?? 0,
      septiembre: totalesRow?.septiembre.toNumber() ?? 0,
      octubre: totalesRow?.octubre.toNumber() ?? 0,
      noviembre: totalesRow?.noviembre.toNumber() ?? 0,
      diciembre: totalesRow?.diciembre.toNumber() ?? 0,
      total: totalesRow?.total.toNumber() ?? 0,
    };

    return {
      controlId: control.OP00Id,
      cooperativaId: control.OP00CooperativaCodigo,
      cooperativaNombre: cooperativa?.R17Nom ?? 'Cooperativa desconocida',
      area: control.OP00Area.toUpperCase() as OpMetaAreaEnum,
      periodoAnio: control.OP00PeriodoAnio,
      filas: mappedFilas,
      totales,
    };
  }
}
