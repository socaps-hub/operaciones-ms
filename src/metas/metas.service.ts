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
import {
  DetalleMetaCaptacionOutput,
  DetalleMetaCaptacionSucursalOutput,
} from './dto/outputs/detalle-meta-captacion.output';

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

type MetaCaptacionMontosRow = {
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

type DetalleMetaCaptacionRawRow = {
  sucursalNumero: string | null;
  sucursalNombre: string;

  vistaEnero: Prisma.Decimal;
  vistaFebrero: Prisma.Decimal;
  vistaMarzo: Prisma.Decimal;
  vistaAbril: Prisma.Decimal;
  vistaMayo: Prisma.Decimal;
  vistaJunio: Prisma.Decimal;
  vistaJulio: Prisma.Decimal;
  vistaAgosto: Prisma.Decimal;
  vistaSeptiembre: Prisma.Decimal;
  vistaOctubre: Prisma.Decimal;
  vistaNoviembre: Prisma.Decimal;
  vistaDiciembre: Prisma.Decimal;
  vistaTotal: Prisma.Decimal;

  plazoEnero: Prisma.Decimal;
  plazoFebrero: Prisma.Decimal;
  plazoMarzo: Prisma.Decimal;
  plazoAbril: Prisma.Decimal;
  plazoMayo: Prisma.Decimal;
  plazoJunio: Prisma.Decimal;
  plazoJulio: Prisma.Decimal;
  plazoAgosto: Prisma.Decimal;
  plazoSeptiembre: Prisma.Decimal;
  plazoOctubre: Prisma.Decimal;
  plazoNoviembre: Prisma.Decimal;
  plazoDiciembre: Prisma.Decimal;
  plazoTotal: Prisma.Decimal;

  infantilEnero: Prisma.Decimal;
  infantilFebrero: Prisma.Decimal;
  infantilMarzo: Prisma.Decimal;
  infantilAbril: Prisma.Decimal;
  infantilMayo: Prisma.Decimal;
  infantilJunio: Prisma.Decimal;
  infantilJulio: Prisma.Decimal;
  infantilAgosto: Prisma.Decimal;
  infantilSeptiembre: Prisma.Decimal;
  infantilOctubre: Prisma.Decimal;
  infantilNoviembre: Prisma.Decimal;
  infantilDiciembre: Prisma.Decimal;
  infantilTotal: Prisma.Decimal;
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
    const rows = await this.oP00ControlMeta.findMany({
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

        metasColocacion: {
          select: {
            OP01SucursalNumero: true,
          },
        },

        metasCaptacion: {
          select: {
            OP02SucursalNumero: true,
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
      const esCredito = row.OP00Area === 'CREDITO';

      const sucursales = esCredito
        ? new Set(row.metasColocacion.map((meta) => meta.OP01SucursalNumero))
            .size
        : new Set(
            row.metasCaptacion
              .map((meta) => meta.OP02SucursalNumero)
              .filter(
                (sucursalNumero): sucursalNumero is string =>
                  sucursalNumero !== null,
              ),
          ).size;

      const metasRegistradas = esCredito
        ? row.metasColocacion.length
        : row.metasCaptacion.length;

      return {
        controlId: row.OP00Id,
        cooperativaId: row.OP00CooperativaCodigo,

        cooperativaNombre:
          cooperativasMap.get(row.OP00CooperativaCodigo) ??
          'Cooperativa desconocida',

        area: row.OP00Area.toUpperCase() as OpMetaAreaEnum,

        periodoAnio: row.OP00PeriodoAnio,

        archivo: row.OP00Archivo,

        fechaCarga: row.OP00FechaCarga.toISOString(),

        sucursales,
        metasRegistradas,
      };
    });
  }

  // CRÉDITO
  public async getDetalleMeta(
    input: GetDetalleMetaInput,
  ): Promise<DetalleMetaOutput> {
    const control = await this.oP00ControlMeta.findUnique({
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

    if (control.OP00Area !== 'CREDITO') {
      throw new RpcException({
        message: 'El detalle solicitado no corresponde a metas de colocación.',
        status: HttpStatus.BAD_REQUEST,
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

  // CAPTACIÓN
  public async getDetalleMetaCaptacion(
    input: GetDetalleMetaInput,
  ): Promise<DetalleMetaCaptacionOutput> {
    const control = await this.oP00ControlMeta.findUnique({
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

    if (control.OP00Area !== 'CAPTACION') {
      throw new RpcException({
        message: 'El detalle solicitado no corresponde a metas de captación.',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const [metas, sucursales, cooperativa] = await Promise.all([
      this.oP02MetaCaptacion.findMany({
        where: {
          OP02ControlId: control.OP00Id,
        },
        select: {
          OP02SucursalNumero: true,
          OP02PeriodoMes: true,
          OP02MetaVista: true,
          OP02MetaPlazo: true,
          OP02MetaInfantil: true,
        },
        orderBy: [
          {
            OP02SucursalNumero: 'asc',
          },
          {
            OP02PeriodoMes: 'asc',
          },
        ],
      }),

      this.r11Sucursal.findMany({
        where: {
          R11Coop_id: control.OP00CooperativaCodigo,
        },
        select: {
          R11NumSuc: true,
          R11Nom: true,
        },
      }),

      this.r17Cooperativas.findUnique({
        where: {
          R17Id: control.OP00CooperativaCodigo,
        },
        select: {
          R17Nom: true,
        },
      }),
    ]);

    const sucursalesMap = new Map(
      sucursales.map((sucursal) => [
        String(sucursal.R11NumSuc),
        sucursal.R11Nom,
      ]),
    );

    const grupos = new Map<string, typeof metas>();

    for (const meta of metas) {
      const key = meta.OP02SucursalNumero ?? '__GLOBAL__';

      const grupo = grupos.get(key);

      if (grupo) {
        grupo.push(meta);
      } else {
        grupos.set(key, [meta]);
      }
    }

    const filas: DetalleMetaCaptacionSucursalOutput[] = Array.from(
      grupos.entries(),
    ).map(([key, metasSucursal]) => {
      const esGlobal = key === '__GLOBAL__';

      return {
        sucursalNumero: esGlobal ? null : key,

        sucursalNombre: esGlobal
          ? 'Global'
          : (sucursalesMap.get(key) ?? 'Sucursal desconocida'),

        vista: this._buildMontosCaptacion(metasSucursal, 'OP02MetaVista'),

        plazo: this._buildMontosCaptacion(metasSucursal, 'OP02MetaPlazo'),

        infantil: this._buildMontosCaptacion(metasSucursal, 'OP02MetaInfantil'),
      };
    });

    return {
      controlId: control.OP00Id,
      cooperativaId: control.OP00CooperativaCodigo,
      cooperativaNombre: cooperativa?.R17Nom ?? 'Cooperativa desconocida',
      area: control.OP00Area.toUpperCase() as OpMetaAreaEnum,
      periodoAnio: control.OP00PeriodoAnio,
      filas,
    };
  }

  //   ===============================
  //   HELPERS
  //   ===============================
  private _buildMontosCaptacion(
    metas: Array<{
      OP02PeriodoMes: number;
      OP02MetaVista: Prisma.Decimal;
      OP02MetaPlazo: Prisma.Decimal;
      OP02MetaInfantil: Prisma.Decimal;
    }>,
    field: 'OP02MetaVista' | 'OP02MetaPlazo' | 'OP02MetaInfantil',
  ) {
    const values = new Map(
      metas.map((meta) => [meta.OP02PeriodoMes, meta[field].toNumber()]),
    );

    const get = (mes: number) => values.get(mes) ?? 0;

    return {
      enero: get(1),
      febrero: get(2),
      marzo: get(3),
      abril: get(4),
      mayo: get(5),
      junio: get(6),
      julio: get(7),
      agosto: get(8),
      septiembre: get(9),
      octubre: get(10),
      noviembre: get(11),
      diciembre: get(12),

      total: Array.from(values.values()).reduce((sum, value) => sum + value, 0),
    };
  }
}
