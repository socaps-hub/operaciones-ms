import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient, RADIO_AREA } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

import { CaptacionPeriodoInput } from './dto/inputs/captacion-periodo.input';
import {
  CaptacionTablaSaldoMesOutput,
  CaptacionTablaSaldosOutput,
  CaptacionTablaSucursalOutput,
} from './dto/outputs/saldos/captacion-tabla-saldos.output';
import {
  CaptacionComposicionComportamientoRow,
  CaptacionComposicionDetalleRow,
  CaptacionProductoDistribucionRow,
  CaptacionCuentasVistaTotalRow,
  CaptacionOficinaSeleccionada,
  CaptacionPosicionClasificacionRow,
  CaptacionPosicionSucursalRow,
  CaptacionPosicionTemporalRow,
  CaptacionProductoComportamientoRow,
  CaptacionProductosAnalisisConfig,
  CaptacionProductosAnalisisTipo,
  CaptacionTablaSaldoRow,
  CaptacionTotalRow,
  CaptacionPresupuestoMetaRow,
  CaptacionPresupuestoProductoConfig,
  CaptacionPresupuestoRealRow,
} from './types';
import { CaptacionBaseInput } from './dto/inputs/captacion-base.input';
import { CaptacionPosicionOutput } from './dto/outputs/saldos/captacion-posicion.output';
import { CaptacionPosicionComportamientoOutput } from './dto/outputs/saldos/captacion-posicion-comportamiento.output';
import { CaptacionPosicionVariacionOutput } from './dto/outputs/saldos/captacion-posicion-variacion.output';
import { CaptacionPosicionBalanceOutput } from './dto/outputs/saldos/captacion-posicion-balance.output';
import { CaptacionPosicionClasificacionOutput } from './dto/outputs/saldos/captacion-posicion-clasificacion.output';
import { CaptacionPosicionSucursalOutput } from './dto/outputs/saldos/captacion-posicion-sucursal.output';
import { CaptacionPosicionAportacionOutput } from './dto/outputs/saldos/captacion-posicion-aportacion.output';
import {
  CaptacionComposicionComportamientoOutput,
  CaptacionComposicionDetalleOutput,
  CaptacionComposicionOutput,
} from './dto/outputs/saldos/captacion-composicion.output';
import { CaptacionProductoInput } from './dto/inputs/captacion-producto.input';
import {
  CaptacionProductosAnalisisOutput,
  CaptacionProductoComportamientoMesOutput,
  CaptacionProductoDistribucionOutput,
} from './dto/outputs/saldos/captacion-productos-analisis.output';
import { CaptacionCumplimientoPresupuestoInput } from './dto/inputs/captacion-cumplimiento-presupuesto.input';
import {
  CaptacionCumplimientoPresupuestoOutput
} from './dto/outputs/cumplimiento-metas/captacion-cumplimiento-presupuesto.output';
import { CaptacionPresupuestoAnalisisEnum } from './enums/captacion-cumplimiento-presupuesto-analisis.enum';

@Injectable()
export class CaptacionService extends PrismaClient implements OnModuleInit {
  private readonly _logger = new Logger('CaptacionService');

  private static readonly PRODUCTOS_ANALISIS_CONFIG: Record<
    CaptacionProductosAnalisisTipo,
    CaptacionProductosAnalisisConfig
  > = {
    VISTA: {
      clasificaciones: ['A la vista', 'CUENTAS SIN MOVIMIENTO'],
      categoriaCatalogo: 'A la vista',
    },

    PLAZO: {
      clasificaciones: ['Plazo Fijo'],
      categoriaCatalogo: 'Plazo Fijo',
    },
  };

  async onModuleInit() {
    await this.$connect();

    this._logger.log('Database connected');
  }

  // =====================================================
  // SALDOS
  // =====================================================
  public async getTablaSaldos(
    input: CaptacionPeriodoInput,
  ): Promise<CaptacionTablaSaldosOutput> {
    try {
      /*
       * Primero obtenemos los cortes de Captación existentes
       * desde enero hasta el período seleccionado.
       *
       * Esto permite diferenciar:
       *
       * saldo = 0
       * de
       * radiografía inexistente.
       */
      const controles = await this.c01ControlCarga.findMany({
        where: {
          C01CooperativaCodigo: input.cooperativaId,
          C01Area: RADIO_AREA.CAPTACION,
          C01PeriodoAnio: input.periodoAnio,
          C01PeriodoMes: {
            gte: 1,
            lte: input.periodoMes,
          },
        },
        select: {
          C01Id: true,
          C01PeriodoMes: true,
        },
        orderBy: {
          C01PeriodoMes: 'asc',
        },
      });

      const mesesDisponibles = new Set(
        controles.map((control) => control.C01PeriodoMes),
      );

      /*
       * Si no existe ningún corte durante el período solicitado,
       * regresamos la estructura temporal vacía.
       *
       * No existe información que consultar en RA02.
       */
      if (controles.length === 0) {
        return {
          sucursales: [],
          totalCooperativa: this._completeMonths(
            [],
            input.periodoMes,
            mesesDisponibles,
          ),
        };
      }

      const controlIds = controles.map((control) => control.C01Id);

      /*
       * Una sola consulta obtiene:
       *
       * sucursal
       * + mes
       * + saldo agregado
       *
       * para todos los cortes disponibles.
       */
      const rows = await this.$queryRaw<CaptacionTablaSaldoRow[]>(
        Prisma.sql`
          SELECT
            r."RA02Sucursal"
              AS "oficinaNumero",

            s."R11Nom"
              AS "oficinaNombre",

            c."C01PeriodoMes"
              AS "mes",

            COALESCE(
              SUM(r."RA02SaldoTotal"),
              0
            )
              AS "saldo"

          FROM "RA02Captacion" r

         INNER JOIN "C01ControlCarga" c
            ON c."C01Id" = r."RA02ControlId"

         LEFT JOIN "R11Sucursal" s
           ON s."R11NumSuc" = r."RA02Sucursal"
             AND s."R11Coop_id" = c."C01CooperativaCodigo"

          WHERE
            r."RA02ControlId" IN (${Prisma.join(controlIds)})

          GROUP BY
            r."RA02Sucursal",
            s."R11Nom",
            c."C01PeriodoMes"

          ORDER BY
            c."C01PeriodoMes",
            r."RA02Sucursal"
        `,
      );

      return this._buildTablaSaldos(rows, input.periodoMes, mesesDisponibles);
    } catch (error: unknown) {
      this._handleRpcError(
        error,
        'Error al obtener la tabla de saldos de captación',
      );
    }
  }

  public async getPosicion(
    input: CaptacionBaseInput,
  ): Promise<CaptacionPosicionOutput> {
    try {
      const oficina = input.oficina?.trim() || undefined;

      const oficinaSeleccionada = await this._getOficina(
        input.cooperativaId,
        oficina,
      );

      const [temporalRows, clasificacionRows, sucursalRows] = await Promise.all(
        [
          this._getPosicionTemporal(input, oficina),
          this._getPosicionClasificaciones(input, oficina),
          this._getPosicionSucursales(input),
        ],
      );

      return this._buildPosicion(
        input,
        oficinaSeleccionada,
        temporalRows,
        clasificacionRows,
        sucursalRows,
      );
    } catch (error: unknown) {
      this._handleRpcError(error, 'Error al obtener la posición de captación');
    }
  }

  public async getComposicion(
    input: CaptacionBaseInput,
  ): Promise<CaptacionComposicionOutput> {
    try {
      const oficina = input.oficina?.trim() || undefined;

      await this._getOficina(input.cooperativaId, oficina);

      const controles = await this.c01ControlCarga.findMany({
        where: {
          C01CooperativaCodigo: input.cooperativaId,
          C01Area: RADIO_AREA.CAPTACION,
          C01PeriodoAnio: input.periodoAnio,
          C01PeriodoMes: {
            gte: 1,
            lte: input.periodoMes,
          },
        },
        select: {
          C01Id: true,
          C01PeriodoMes: true,
        },
        orderBy: {
          C01PeriodoMes: 'asc',
        },
      });

      const mesesDisponibles = new Set(
        controles.map((control) => control.C01PeriodoMes),
      );

      const controlActual = controles.find(
        (control) => control.C01PeriodoMes === input.periodoMes,
      );

      /*
       * No existe el corte seleccionado.
       *
       * El comportamiento conserva la estructura enero → mes
       * y marca como disponibles únicamente los cortes que sí existen.
       */
      if (!controlActual) {
        const comportamientoRows =
          controles.length > 0
            ? await this._getComposicionComportamiento(
                controles.map((control) => control.C01Id),
                oficina,
              )
            : [];

        return {
          composicion: [],
          comportamiento: this._buildComposicionComportamiento(
            comportamientoRows,
            input.periodoMes,
            mesesDisponibles,
          ),
        };
      }

      const controlIds = controles.map((control) => control.C01Id);

      const [composicionRows, comportamientoRows] = await Promise.all([
        this._getComposicionDetalle(controlActual.C01Id, oficina),

        this._getComposicionComportamiento(controlIds, oficina),
      ]);

      return {
        composicion: this._buildComposicionDetalle(composicionRows),

        comportamiento: this._buildComposicionComportamiento(
          comportamientoRows,
          input.periodoMes,
          mesesDisponibles,
        ),
      };
    } catch (error: unknown) {
      this._handleRpcError(
        error,
        'Error al obtener la composición de captación',
      );
    }
  }

  public getCuentasVista(
    input: CaptacionProductoInput,
  ): Promise<CaptacionProductosAnalisisOutput> {
    return this._getAnalisisProductos(input, 'VISTA');
  }

  public getCuentasPlazo(
    input: CaptacionProductoInput,
  ): Promise<CaptacionProductosAnalisisOutput> {
    return this._getAnalisisProductos(input, 'PLAZO');
  }

  // =====================================================
  // CUMPLIMIENTO - METAS
  // =====================================================
  public async getCumplimientoPresupuesto(
    input: CaptacionCumplimientoPresupuestoInput,
  ): Promise<CaptacionCumplimientoPresupuestoOutput> {
    try {
      const oficina = input.oficina?.trim() || undefined;

      await this._getOficina(input.cooperativaId, oficina);

      const [metas, productos] = await Promise.all([
        this._getPresupuestoMetas(input, oficina),
        this._getPresupuestoProductos(input.cooperativaId, input.analisis),
      ]);

      const reales = await this._getPresupuestoReales(
        input,
        oficina,
        productos,
      );

      return this._buildCumplimientoPresupuesto(input, metas, reales);
    } catch (error: unknown) {
      this._handleRpcError(
        error,
        'Error al obtener el cumplimiento al presupuesto de captación',
      );
    }
  }

  // ====================================
  // HELPERS
  // ====================================

  private _buildTablaSaldos(
    rows: CaptacionTablaSaldoRow[],
    periodoMes: number,
    mesesDisponibles: ReadonlySet<number>,
  ): CaptacionTablaSaldosOutput {
    const sucursales = new Map<string, CaptacionTablaSucursalOutput>();

    const totalesPorMes = new Map<number, number>();

    for (const row of rows) {
      const saldo = this._toNumber(row.saldo);

      let sucursal = sucursales.get(row.oficinaNumero);

      if (!sucursal) {
        sucursal = {
          oficinaNumero: row.oficinaNumero,

          oficinaNombre: row.oficinaNombre ?? `Sucursal ${row.oficinaNumero}`,

          meses: [],
        };

        sucursales.set(row.oficinaNumero, sucursal);
      }

      if (!row.oficinaNombre) {
        this._logger.warn(
          `No se encontró la sucursal ${row.oficinaNumero} ` +
            `en el catálogo R11Sucursal.`,
        );
      }

      sucursal.meses.push({
        mes: row.mes,
        saldo,
        disponible: true,
      });

      totalesPorMes.set(row.mes, (totalesPorMes.get(row.mes) ?? 0) + saldo);
    }

    return {
      sucursales: Array.from(sucursales.values()).map((sucursal) => ({
        ...sucursal,

        meses: this._completeMonths(
          sucursal.meses,
          periodoMes,
          mesesDisponibles,
        ),
      })),

      totalCooperativa: this._buildTotalCooperativa(
        totalesPorMes,
        periodoMes,
        mesesDisponibles,
      ),
    };
  }

  private _buildTotalCooperativa(
    totalesPorMes: ReadonlyMap<number, number>,
    periodoMes: number,
    mesesDisponibles: ReadonlySet<number>,
  ): CaptacionTablaSaldoMesOutput[] {
    return Array.from({ length: periodoMes }, (_, index) => {
      const mes = index + 1;
      const disponible = mesesDisponibles.has(mes);

      return {
        mes,

        saldo: disponible ? (totalesPorMes.get(mes) ?? 0) : null,

        disponible,
      };
    });
  }

  private _completeMonths(
    meses: CaptacionTablaSaldoMesOutput[],
    periodoMes: number,
    mesesDisponibles: ReadonlySet<number>,
  ): CaptacionTablaSaldoMesOutput[] {
    const saldosPorMes = new Map(meses.map((item) => [item.mes, item.saldo]));

    return Array.from({ length: periodoMes }, (_, index) => {
      const mes = index + 1;
      const disponible = mesesDisponibles.has(mes);

      return {
        mes,

        saldo: disponible ? (saldosPorMes.get(mes) ?? 0) : null,

        disponible,
      };
    });
  }

  private _toNumber(
    value: Prisma.Decimal | number | bigint | string | null | undefined,
  ): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  }

  private _handleRpcError(error: unknown, context: string): never {
    if (error instanceof RpcException) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    this._logger.error(
      `${context}: ${message}`,
      error instanceof Error ? error.stack : undefined,
    );

    throw new RpcException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `${context}: ${message}`,
    });
  }

  private async _getPosicionTemporal(
    input: CaptacionBaseInput,
    oficina?: string,
  ): Promise<CaptacionPosicionTemporalRow[]> {
    const oficinaWhere = oficina
      ? Prisma.sql`AND r."RA02Sucursal" = ${oficina}`
      : Prisma.empty;

    return this.$queryRaw<CaptacionPosicionTemporalRow[]>(
      Prisma.sql`
      SELECT
        c."C01PeriodoAnio" AS "anio",
        c."C01PeriodoMes" AS "mes",
        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        ) AS "saldo"

      FROM "RA02Captacion" r

      INNER JOIN "C01ControlCarga" c
        ON c."C01Id" = r."RA02ControlId"

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01Area" = 'CAPTACION'::"RADIO_AREA"

        AND (
          (
            c."C01PeriodoAnio" = ${input.periodoAnio - 1}
            AND c."C01PeriodoMes" = 12
          )
          OR
          (
            c."C01PeriodoAnio" = ${input.periodoAnio}
            AND c."C01PeriodoMes"
              BETWEEN 1 AND ${input.periodoMes}
          )
        )

        ${oficinaWhere}

      GROUP BY
        c."C01PeriodoAnio",
        c."C01PeriodoMes"

      ORDER BY
        c."C01PeriodoAnio",
        c."C01PeriodoMes"
    `,
    );
  }

  private async _getPosicionClasificaciones(
    input: CaptacionBaseInput,
    oficina?: string,
  ): Promise<CaptacionPosicionClasificacionRow[]> {
    const oficinaWhere = oficina
      ? Prisma.sql`AND r."RA02Sucursal" = ${oficina}`
      : Prisma.empty;

    return this.$queryRaw<CaptacionPosicionClasificacionRow[]>(
      Prisma.sql`
      SELECT
        r."RA02ClasificacionContable"
          AS "clasificacion",

        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        )
          AS "saldo",

        COUNT(*)
          AS "numeroCuentas"

      FROM "RA02Captacion" r

      INNER JOIN "C01ControlCarga" c
        ON c."C01Id" = r."RA02ControlId"

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01Area" = 'CAPTACION'::"RADIO_AREA"
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01PeriodoMes" = ${input.periodoMes}

        ${oficinaWhere}

      GROUP BY
        r."RA02ClasificacionContable"

      ORDER BY
        SUM(r."RA02SaldoTotal") DESC
    `,
    );
  }

  private async _getPosicionSucursales(
    input: CaptacionBaseInput,
  ): Promise<CaptacionPosicionSucursalRow[]> {
    return this.$queryRaw<CaptacionPosicionSucursalRow[]>(
      Prisma.sql`
      SELECT
        r."RA02Sucursal"
          AS "oficinaNumero",

        s."R11Nom"
          AS "oficinaNombre",

        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        )
          AS "saldo"

      FROM "RA02Captacion" r

      INNER JOIN "C01ControlCarga" c
        ON c."C01Id" = r."RA02ControlId"

      LEFT JOIN "R11Sucursal" s
        ON s."R11NumSuc" = r."RA02Sucursal"
        AND s."R11Coop_id" = c."C01CooperativaCodigo"

      WHERE
        c."C01CooperativaCodigo" = ${input.cooperativaId}::uuid
        AND c."C01Area" = 'CAPTACION'::"RADIO_AREA"
        AND c."C01PeriodoAnio" = ${input.periodoAnio}
        AND c."C01PeriodoMes" = ${input.periodoMes}

      GROUP BY
        r."RA02Sucursal",
        s."R11Nom"

      ORDER BY
        SUM(r."RA02SaldoTotal") DESC
    `,
    );
  }

  private _buildPosicion(
    input: CaptacionBaseInput,
    oficina: CaptacionOficinaSeleccionada | null,
    temporalRows: CaptacionPosicionTemporalRow[],
    clasificacionRows: CaptacionPosicionClasificacionRow[],
    sucursalRows: CaptacionPosicionSucursalRow[],
  ): CaptacionPosicionOutput {
    const temporal = new Map<string, number>();

    for (const row of temporalRows) {
      temporal.set(
        this._getPeriodoKey(row.anio, row.mes),
        this._toNumber(row.saldo),
      );
    }

    const comportamiento = this._buildComportamiento(input, temporal);

    const variaciones = this._buildVariaciones(input, temporal);

    const balance = this._buildBalance(input, temporal);

    const sucursales = this._buildPosicionSucursales(sucursalRows);

    const aportacion = this._buildAportacion(oficina, sucursales);

    const clasificaciones =
      this._buildPosicionClasificaciones(clasificacionRows);

    return {
      balance,
      aportacion,
      clasificaciones,
      sucursales,
      comportamiento,
      variaciones,
    };
  }

  private _getPeriodoKey(anio: number, mes: number): string {
    return `${anio}-${mes}`;
  }

  private _buildComportamiento(
    input: CaptacionBaseInput,
    temporal: ReadonlyMap<string, number>,
  ): CaptacionPosicionComportamientoOutput[] {
    return Array.from({ length: input.periodoMes }, (_, index) => {
      const mes = index + 1;

      const saldo = temporal.get(this._getPeriodoKey(input.periodoAnio, mes));

      return {
        mes,
        saldo: saldo ?? null,
        disponible: saldo !== undefined,
      };
    });
  }

  private _buildVariaciones(
    input: CaptacionBaseInput,
    temporal: ReadonlyMap<string, number>,
  ): CaptacionPosicionVariacionOutput[] {
    return Array.from({ length: input.periodoMes }, (_, index) => {
      const mes = index + 1;

      const saldoActual = temporal.get(
        this._getPeriodoKey(input.periodoAnio, mes),
      );

      const periodoAnterior = this._getPeriodoAnterior(input.periodoAnio, mes);

      const saldoAnterior = temporal.get(
        this._getPeriodoKey(periodoAnterior.anio, periodoAnterior.mes),
      );

      if (saldoActual === undefined || saldoAnterior === undefined) {
        return {
          mes,
          monto: null,
          porcentaje: null,
          disponible: false,
        };
      }

      const monto = saldoActual - saldoAnterior;

      return {
        mes,
        monto,
        porcentaje: this._calculateVariationPercentage(saldoAnterior, monto),
        disponible: true,
      };
    });
  }

  private _getPeriodoAnterior(
    anio: number,
    mes: number,
  ): { anio: number; mes: number } {
    if (mes === 1) {
      return {
        anio: anio - 1,
        mes: 12,
      };
    }

    return {
      anio,
      mes: mes - 1,
    };
  }

  private _buildBalance(
    input: CaptacionBaseInput,
    temporal: ReadonlyMap<string, number>,
  ): CaptacionPosicionBalanceOutput {
    const saldoCierre = temporal.get(
      this._getPeriodoKey(input.periodoAnio, input.periodoMes),
    );

    const periodoAnterior = this._getPeriodoAnterior(
      input.periodoAnio,
      input.periodoMes,
    );

    const saldoInicial = temporal.get(
      this._getPeriodoKey(periodoAnterior.anio, periodoAnterior.mes),
    );

    if (saldoInicial === undefined || saldoCierre === undefined) {
      return {
        saldoInicial: saldoInicial ?? null,
        saldoCierre: saldoCierre ?? null,
        variacionMonto: null,
        variacionPorcentaje: null,
        disponible: false,
      };
    }

    const variacionMonto = saldoCierre - saldoInicial;

    return {
      saldoInicial,
      saldoCierre,
      variacionMonto,
      variacionPorcentaje: this._calculateVariationPercentage(
        saldoInicial,
        variacionMonto,
      ),
      disponible: true,
    };
  }

  private _calculateVariationPercentage(
    saldoInicial: number,
    variacionMonto: number,
  ): number | null {
    if (saldoInicial === 0) {
      return null;
    }

    return (variacionMonto / Math.abs(saldoInicial)) * 100;
  }

  private _buildPosicionClasificaciones(
    rows: CaptacionPosicionClasificacionRow[],
  ): CaptacionPosicionClasificacionOutput[] {
    const total = rows.reduce((acc, row) => acc + this._toNumber(row.saldo), 0);

    return rows.map((row) => {
      const saldo = this._toNumber(row.saldo);

      return {
        clasificacion: row.clasificacion?.trim() || 'SIN CLASIFICACIÓN',

        saldo,

        participacion: this._calculatePercentage(saldo, total),

        numeroCuentas: this._toNumber(row.numeroCuentas),
      };
    });
  }

  private _buildPosicionSucursales(
    rows: CaptacionPosicionSucursalRow[],
  ): CaptacionPosicionSucursalOutput[] {
    const total = rows.reduce((acc, row) => acc + this._toNumber(row.saldo), 0);

    return rows.map((row) => {
      const saldo = this._toNumber(row.saldo);

      if (!row.oficinaNombre) {
        this._logger.warn(
          `No se encontró la sucursal ${row.oficinaNumero} ` +
            'en el catálogo R11Sucursal.',
        );
      }

      return {
        oficinaNumero: row.oficinaNumero,

        oficinaNombre: row.oficinaNombre ?? `Sucursal ${row.oficinaNumero}`,

        saldo,

        participacion: this._calculatePercentage(saldo, total),
      };
    });
  }

  private _buildAportacion(
    oficina: CaptacionOficinaSeleccionada | null,
    sucursales: CaptacionPosicionSucursalOutput[],
  ): CaptacionPosicionAportacionOutput {
    const totalCooperativa = sucursales.reduce(
      (acc, sucursal) => acc + sucursal.saldo,
      0,
    );

    if (!oficina) {
      return {
        nombre: 'GLOBAL',
        saldo: totalCooperativa,
        porcentaje: totalCooperativa > 0 ? 100 : 0,
      };
    }

    const sucursal = sucursales.find(
      (item) => item.oficinaNumero === oficina.numero,
    );

    if (!sucursal) {
      return {
        nombre: oficina.nombre,
        saldo: 0,
        porcentaje: 0,
      };
    }

    return {
      nombre: oficina.nombre,
      saldo: sucursal.saldo,
      porcentaje: this._calculatePercentage(sucursal.saldo, totalCooperativa),
    };
  }

  private _calculatePercentage(value: number, total: number): number {
    if (total === 0) {
      return 0;
    }

    return (value / total) * 100;
  }

  private async _getOficina(
    cooperativaId: string,
    oficina?: string,
  ): Promise<CaptacionOficinaSeleccionada | null> {
    if (!oficina) {
      return null;
    }

    const sucursal = await this.r11Sucursal.findFirst({
      where: {
        R11Coop_id: cooperativaId,
        R11NumSuc: oficina,
      },
      select: {
        R11NumSuc: true,
        R11Nom: true,
      },
    });

    if (!sucursal) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La oficina ${oficina} no pertenece a la cooperativa seleccionada.`,
      });
    }

    return {
      numero: sucursal.R11NumSuc,
      nombre: sucursal.R11Nom,
    };
  }

  private async _getComposicionDetalle(
    controlId: number,
    oficina?: string,
  ): Promise<CaptacionComposicionDetalleRow[]> {
    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA02Sucursal" = ${oficina}
      `
      : Prisma.empty;

    return this.$queryRaw<CaptacionComposicionDetalleRow[]>(
      Prisma.sql`
      SELECT
        r."RA02ClasificacionContable"
          AS "clasificacion",

        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        )
          AS "saldo",

        COUNT(*)
          AS "numeroCuentas"

      FROM "RA02Captacion" r

      WHERE
        r."RA02ControlId" = ${controlId}

        ${oficinaWhere}

      GROUP BY
        r."RA02ClasificacionContable"

      ORDER BY
        SUM(r."RA02SaldoTotal") DESC
    `,
    );
  }

  private async _getComposicionComportamiento(
    controlIds: number[],
    oficina?: string,
  ): Promise<CaptacionComposicionComportamientoRow[]> {
    if (controlIds.length === 0) {
      return [];
    }

    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA02Sucursal" = ${oficina}
      `
      : Prisma.empty;

    return this.$queryRaw<CaptacionComposicionComportamientoRow[]>(
      Prisma.sql`
      SELECT
        r."RA02ClasificacionContable"
          AS "clasificacion",

        c."C01PeriodoMes"
          AS "mes",

        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        )
          AS "saldo"

      FROM "RA02Captacion" r

      INNER JOIN "C01ControlCarga" c
        ON c."C01Id" = r."RA02ControlId"

      WHERE
        r."RA02ControlId"
          IN (${Prisma.join(controlIds)})

        ${oficinaWhere}

      GROUP BY
        r."RA02ClasificacionContable",
        c."C01PeriodoMes"

      ORDER BY
        c."C01PeriodoMes",
        r."RA02ClasificacionContable"
    `,
    );
  }

  private _buildComposicionDetalle(
    rows: CaptacionComposicionDetalleRow[],
  ): CaptacionComposicionDetalleOutput[] {
    const total = rows.reduce((acc, row) => acc + this._toNumber(row.saldo), 0);

    return rows.map((row) => {
      const saldo = this._toNumber(row.saldo);

      return {
        clasificacion: row.clasificacion?.trim() || 'SIN CLASIFICACIÓN',

        saldo,

        participacion: this._calculatePercentage(saldo, total),

        numeroCuentas: this._toNumber(row.numeroCuentas),
      };
    });
  }

  private _buildComposicionComportamiento(
    rows: CaptacionComposicionComportamientoRow[],
    periodoMes: number,
    mesesDisponibles: ReadonlySet<number>,
  ): CaptacionComposicionComportamientoOutput[] {
    const clasificaciones = new Map<string, Map<number, number>>();

    for (const row of rows) {
      const clasificacion = row.clasificacion?.trim() || 'SIN CLASIFICACIÓN';

      let saldosPorMes = clasificaciones.get(clasificacion);

      if (!saldosPorMes) {
        saldosPorMes = new Map<number, number>();

        clasificaciones.set(clasificacion, saldosPorMes);
      }

      saldosPorMes.set(row.mes, this._toNumber(row.saldo));
    }

    return Array.from(clasificaciones.entries()).map(
      ([clasificacion, saldosPorMes]) => ({
        clasificacion,

        meses: Array.from({ length: periodoMes }, (_, index) => {
          const mes = index + 1;

          const disponible = mesesDisponibles.has(mes);

          return {
            mes,

            saldo: disponible ? (saldosPorMes.get(mes) ?? 0) : null,

            disponible,
          };
        }),
      }),
    );
  }

  private async _getCaptacionTotal(
    controlId: number,
    oficina?: string,
  ): Promise<CaptacionCuentasVistaTotalRow[]> {
    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA02Sucursal" = ${oficina}
      `
      : Prisma.empty;

    return this.$queryRaw<CaptacionCuentasVistaTotalRow[]>(
      Prisma.sql`
      SELECT
        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        )
          AS "saldoCaptacion"

      FROM "RA02Captacion" r

      WHERE
        r."RA02ControlId" = ${controlId}

        ${oficinaWhere}
    `,
    );
  }

  private async _getAnalisisProductos(
    input: CaptacionProductoInput,
    tipo: CaptacionProductosAnalisisTipo,
  ): Promise<CaptacionProductosAnalisisOutput> {
    try {
      const config = CaptacionService.PRODUCTOS_ANALISIS_CONFIG[tipo];

      const oficina = input.oficina?.trim() || undefined;

      const producto = input.producto.trim().toLowerCase();

      await Promise.all([
        this._getOficina(input.cooperativaId, oficina),

        this._validateProductoCaptacion(
          input.cooperativaId,
          producto,
          config.categoriaCatalogo,
        ),
      ]);

      const controles = await this.c01ControlCarga.findMany({
        where: {
          C01CooperativaCodigo: input.cooperativaId,

          C01Area: RADIO_AREA.CAPTACION,

          C01PeriodoAnio: input.periodoAnio,

          C01PeriodoMes: {
            gte: 1,
            lte: input.periodoMes,
          },
        },

        select: {
          C01Id: true,
          C01PeriodoMes: true,
        },

        orderBy: {
          C01PeriodoMes: 'asc',
        },
      });

      const mesesDisponibles = new Set(
        controles.map((control) => control.C01PeriodoMes),
      );

      const controlActual = controles.find(
        (control) => control.C01PeriodoMes === input.periodoMes,
      );

      const controlIds = controles.map((control) => control.C01Id);

      if (!controlActual) {
        const comportamientoRows = await this._getProductoComportamiento(
          controlIds,
          producto,
          oficina,
          config.clasificaciones,
        );

        return {
          resumen: {
            saldoTotal: null,
            numeroCuentas: null,
            participacionCaptacion: null,
            disponible: false,
          },

          productos: [],

          productoSeleccionado: {
            producto,
            saldo: null,
            participacion: null,
            disponible: false,
          },

          comportamientoProducto: this._buildProductoComportamiento(
            comportamientoRows,
            input.periodoMes,
            mesesDisponibles,
          ),
        };
      }

      const [productosRows, captacionRows, comportamientoRows] =
        await Promise.all([
          this._getProductosDistribucion(
            controlActual.C01Id,
            oficina,
            config.clasificaciones,
          ),

          this._getCaptacionTotal(controlActual.C01Id, oficina),

          this._getProductoComportamiento(
            controlIds,
            producto,
            oficina,
            config.clasificaciones,
          ),
        ]);

      return this._buildProductosAnalisisOutput(
        producto,
        productosRows,
        captacionRows[0],
        comportamientoRows,
        input.periodoMes,
        mesesDisponibles,
      );
    } catch (error: unknown) {
      this._handleRpcError(
        error,
        `Error al obtener análisis de productos de Captación (${tipo})`,
      );
    }
  }

  private async _validateProductoCaptacion(
    cooperativaId: string,
    producto: string,
    categoria: string,
  ): Promise<void> {
    const productoCatalogo = await this.r27ProductoCaptacion.findFirst({
      where: {
        R27Coop_id: cooperativaId,
        R27Activ: true,
        R27Nom: producto,

        categoria: {
          R26Activ: true,

          R26Nom: {
            equals: categoria,
            mode: 'insensitive',
          },
        },
      },

      select: {
        R27Id: true,
      },
    });

    if (!productoCatalogo) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El producto "${producto}" no pertenece a la categoría "${categoria}"`,
      });
    }
  }

  private async _getProductosDistribucion(
    controlId: number,
    oficina: string | undefined,
    clasificaciones: readonly string[],
  ): Promise<CaptacionProductoDistribucionRow[]> {
    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA02Sucursal" = ${oficina}
      `
      : Prisma.empty;

    return this.$queryRaw<CaptacionProductoDistribucionRow[]>(
      Prisma.sql`
      SELECT
        LOWER(
          TRIM(r."RA02Producto")
        ) AS "producto",

        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        ) AS "saldo",

        COUNT(*) AS "numeroCuentas"

      FROM "RA02Captacion" r

      WHERE
        r."RA02ControlId" = ${controlId}

        AND r."RA02ClasificacionContable"
          IN (${Prisma.join(clasificaciones)})

        ${oficinaWhere}

      GROUP BY
        LOWER(
          TRIM(r."RA02Producto")
        )

      ORDER BY
        SUM(r."RA02SaldoTotal") DESC
    `,
    );
  }

  private async _getProductoComportamiento(
    controlIds: number[],
    producto: string,
    oficina: string | undefined,
    clasificaciones: readonly string[],
  ): Promise<CaptacionProductoComportamientoRow[]> {
    if (controlIds.length === 0) {
      return [];
    }

    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA02Sucursal" = ${oficina}
      `
      : Prisma.empty;

    return this.$queryRaw<CaptacionProductoComportamientoRow[]>(
      Prisma.sql`
      SELECT
        c."C01PeriodoMes"
          AS "mes",

        COALESCE(
          SUM(r."RA02SaldoTotal"),
          0
        ) AS "saldo"

      FROM "RA02Captacion" r

      INNER JOIN "C01ControlCarga" c
        ON c."C01Id" =
           r."RA02ControlId"

      WHERE
        r."RA02ControlId"
          IN (${Prisma.join(controlIds)})

        AND r."RA02ClasificacionContable"
          IN (${Prisma.join(clasificaciones)})

        AND LOWER(
          TRIM(r."RA02Producto")
        ) = ${producto}

        ${oficinaWhere}

      GROUP BY
        c."C01PeriodoMes"

      ORDER BY
        c."C01PeriodoMes"
    `,
    );
  }

  private _buildProductosAnalisisOutput(
    productoSeleccionado: string,
    productosRows: CaptacionProductoDistribucionRow[],
    captacionRow: CaptacionTotalRow | undefined,
    comportamientoRows: CaptacionProductoComportamientoRow[],
    periodoMes: number,
    mesesDisponibles: ReadonlySet<number>,
  ): CaptacionProductosAnalisisOutput {
    const saldoTotal = productosRows.reduce(
      (total, row) => total + this._toNumber(row.saldo),
      0,
    );

    const numeroCuentas = productosRows.reduce(
      (total, row) => total + this._toNumber(row.numeroCuentas),
      0,
    );

    const saldoCaptacion = this._toNumber(captacionRow?.saldoCaptacion ?? 0);

    const productos: CaptacionProductoDistribucionOutput[] = productosRows.map(
      (row) => {
        const saldo = this._toNumber(row.saldo);

        return {
          producto: row.producto?.trim() || 'sin producto',

          saldo,

          participacion: this._calculatePercentage(saldo, saldoTotal),

          numeroCuentas: this._toNumber(row.numeroCuentas),
        };
      },
    );

    /*
     * productoSeleccionado ya llega normalizado
     * mediante trim().toLowerCase().
     *
     * Los productos de la distribución también
     * vienen normalizados desde SQL:
     *
     * LOWER(TRIM(r."RA02Producto"))
     */
    const productoActual = productos.find(
      (producto) => producto.producto === productoSeleccionado,
    );

    return {
      resumen: {
        saldoTotal,
        numeroCuentas,

        participacionCaptacion: this._calculatePercentage(
          saldoTotal,
          saldoCaptacion,
        ),

        disponible: true,
      },

      productos,

      productoSeleccionado: {
        producto: productoActual?.producto ?? productoSeleccionado,

        saldo: productoActual?.saldo ?? 0,

        participacion: productoActual?.participacion ?? 0,

        disponible: true,
      },

      comportamientoProducto: this._buildProductoComportamiento(
        comportamientoRows,
        periodoMes,
        mesesDisponibles,
      ),
    };
  }

  private _buildProductoComportamiento(
    rows: CaptacionProductoComportamientoRow[],
    periodoMes: number,
    mesesDisponibles: ReadonlySet<number>,
  ): CaptacionProductoComportamientoMesOutput[] {
    const saldosPorMes = new Map<number, number>(
      rows.map((row) => [row.mes, this._toNumber(row.saldo)]),
    );

    return Array.from({ length: periodoMes }, (_, index) => {
      const mes = index + 1;

      const disponible = mesesDisponibles.has(mes);

      return {
        mes,

        saldo: disponible ? (saldosPorMes.get(mes) ?? 0) : null,

        disponible,
      };
    });
  }

  private async _getPresupuestoMetas(
    input: CaptacionCumplimientoPresupuestoInput,
    oficina?: string,
  ): Promise<CaptacionPresupuestoMetaRow[]> {
    const metaExpression = this._getPresupuestoMetaExpression(input.analisis);

    const oficinaWhere = oficina
      ? Prisma.sql`
        m."OP02SucursalNumero" = ${oficina}
      `
      : Prisma.sql`
        m."OP02SucursalNumero" IS NULL
      `;

    return this.$queryRaw<CaptacionPresupuestoMetaRow[]>(
      Prisma.sql`
      SELECT
        m."OP02PeriodoMes" AS "mes",

        (
          ${metaExpression}
        ) AS "meta"

      FROM "OP02MetaCaptacion" m

      INNER JOIN "OP00ControlMetaColocacion" c
        ON c."OP00Id" = m."OP02ControlId"

      WHERE
        c."OP00CooperativaCodigo" =
          ${input.cooperativaId}::uuid

        AND c."OP00PeriodoAnio" =
          ${input.periodoAnio}

        AND c."OP00Area" =
          'CAPTACION'::"OP_META_AREA"

        AND ${oficinaWhere}

      ORDER BY
        m."OP02PeriodoMes"
    `,
    );
  }

  private _getPresupuestoMetaExpression(
    analisis: CaptacionPresupuestoAnalisisEnum,
  ): Prisma.Sql {
    switch (analisis) {
      case CaptacionPresupuestoAnalisisEnum.CAPTACION_TOTAL:
        return Prisma.sql`
        m."OP02MetaVista"
        + m."OP02MetaPlazo"
        + m."OP02MetaInfantil"
      `;

      case CaptacionPresupuestoAnalisisEnum.CUENTAS_PLAZO:
        return Prisma.sql`
        m."OP02MetaPlazo"
      `;

      case CaptacionPresupuestoAnalisisEnum.CUENTAS_VISTA:
        return Prisma.sql`
        m."OP02MetaVista"
      `;

      case CaptacionPresupuestoAnalisisEnum.AHORRADOR_MENOR:
        return Prisma.sql`
        m."OP02MetaInfantil"
      `;
    }
  }

  private async _getPresupuestoProductos(
    cooperativaId: string,
    analisis: CaptacionPresupuestoAnalisisEnum,
  ): Promise<CaptacionPresupuestoProductoConfig> {
    if (analisis === CaptacionPresupuestoAnalisisEnum.CAPTACION_TOTAL) {
      return {
        vista: [],
        plazo: [],
        infantil: [],
      };
    }

    const productos = await this.r27ProductoCaptacion.findMany({
      where: {
        R27Coop_id: cooperativaId,
        R27Activ: true,
      },

      select: {
        R27Nom: true,
        R27EsInfantil: true,

        categoria: {
          select: {
            R26Nom: true,
          },
        },
      },
    });

    const config: CaptacionPresupuestoProductoConfig = {
      vista: [],
      plazo: [],
      infantil: [],
    };

    for (const producto of productos) {
      const nombre = producto.R27Nom.trim();

      const categoria =
        producto.categoria.R26Nom.trim().toLocaleLowerCase('es-MX');

      if (categoria === 'plazo fijo') {
        config.plazo.push(nombre);
        continue;
      }

      if (categoria !== 'a la vista') {
        continue;
      }

      // Todos los productos A la vista, incluidos infantiles.
      config.vista.push(nombre);

      // Infantil es un subconjunto de Vista.
      if (producto.R27EsInfantil) {
        config.infantil.push(nombre);
      }
    }

    return config;
  }

  private _getPresupuestoProductoWhere(
    analisis: CaptacionPresupuestoAnalisisEnum,
    productos: CaptacionPresupuestoProductoConfig,
  ): Prisma.Sql {
    switch (analisis) {
      case CaptacionPresupuestoAnalisisEnum.CAPTACION_TOTAL:
        return Prisma.empty;

      case CaptacionPresupuestoAnalisisEnum.CUENTAS_PLAZO:
        return this._buildProductoInWhere(productos.plazo);

      case CaptacionPresupuestoAnalisisEnum.CUENTAS_VISTA:
        return this._buildProductoInWhere(productos.vista);

      case CaptacionPresupuestoAnalisisEnum.AHORRADOR_MENOR:
        return this._buildProductoInWhere(productos.infantil);
    }
  }

  private _buildProductoInWhere(productos: string[]): Prisma.Sql {
    if (productos.length === 0) {
      return Prisma.sql`
        AND FALSE
      `;
    }

    return Prisma.sql`
      AND LOWER(TRIM(r."RA02Producto"))
        IN (
          ${Prisma.join(
            productos.map((producto) =>
              producto.trim().toLocaleLowerCase('es-MX'),
            ),
          )}
        )
    `;
  }

  private async _getPresupuestoReales(
    input: CaptacionCumplimientoPresupuestoInput,
    oficina: string | undefined,
    productos: CaptacionPresupuestoProductoConfig,
  ): Promise<CaptacionPresupuestoRealRow[]> {
    const oficinaWhere = oficina
      ? Prisma.sql`
        AND r."RA02Sucursal" = ${oficina}
      `
      : Prisma.empty;

    const productoWhere = this._getPresupuestoProductoWhere(
      input.analisis,
      productos,
    );

    return this.$queryRaw<CaptacionPresupuestoRealRow[]>(
      Prisma.sql`
        SELECT
          c."C01PeriodoAnio" AS "anio",
          c."C01PeriodoMes" AS "mes",

          COALESCE(
            SUM(r."RA02SaldoTotal"),
            0
          ) AS "saldo"

        FROM "C01ControlCarga" c

               LEFT JOIN "RA02Captacion" r
                         ON r."RA02ControlId" = c."C01Id"

          ${oficinaWhere}
          ${productoWhere}

        WHERE
          c."C01CooperativaCodigo" =
          ${input.cooperativaId}::uuid

          AND c."C01Area" =
          'CAPTACION'::"RADIO_AREA"

          AND (
            (
          c."C01PeriodoAnio" =
          ${input.periodoAnio - 1}

          AND c."C01PeriodoMes" = 12
          )
           OR
            (
          c."C01PeriodoAnio" =
          ${input.periodoAnio}

          AND c."C01PeriodoMes"
          BETWEEN 1 AND ${input.periodoMes}
          )
          )

        GROUP BY
          c."C01PeriodoAnio",
          c."C01PeriodoMes"

        ORDER BY
          c."C01PeriodoAnio",
          c."C01PeriodoMes"
      `,
    );
  }

  private _buildCumplimientoPresupuesto(
    input: CaptacionCumplimientoPresupuestoInput,
    metas: CaptacionPresupuestoMetaRow[],
    reales: CaptacionPresupuestoRealRow[],
  ): CaptacionCumplimientoPresupuestoOutput {
    const metasPorMes = new Map<number, number>(
      metas.map((row) => [row.mes, this._toNumber(row.meta)]),
    );

    const saldosPorPeriodo = new Map<string, number>(
      reales.map((row) => [
        this._getPeriodoKey(row.anio, row.mes),
        this._toNumber(row.saldo),
      ]),
    );

    const metaAnual = Array.from(
      { length: 12 },
      (_, index) => metasPorMes.get(index + 1) ?? 0,
    ).reduce((total, meta) => total + meta, 0);

    const cifraEsperada = Array.from(
      { length: input.periodoMes },
      (_, index) => metasPorMes.get(index + 1) ?? 0,
    ).reduce((total, meta) => total + meta, 0);

    const variaciones = new Map<number, number | null>();

    for (let mes = 1; mes <= input.periodoMes; mes++) {
      const periodoActual = this._getPeriodoKey(input.periodoAnio, mes);

      const anterior = this._getPeriodoAnterior(input.periodoAnio, mes);

      const periodoPrevio = this._getPeriodoKey(anterior.anio, anterior.mes);

      const saldoActual = saldosPorPeriodo.get(periodoActual);
      const saldoAnterior = saldosPorPeriodo.get(periodoPrevio);

      if (saldoActual === undefined || saldoAnterior === undefined) {
        variaciones.set(mes, null);
        continue;
      }

      variaciones.set(mes, saldoActual - saldoAnterior);
    }

    const variacionesAcumuladas = Array.from(
      { length: input.periodoMes },
      (_, index) => variaciones.get(index + 1) ?? null,
    );

    const acumuladoDisponible = variacionesAcumuladas.every(
      (variacion) => variacion !== null,
    );

    const llevan = acumuladoDisponible
      ? variacionesAcumuladas.reduce<number>(
          (total, variacion) => total + (variacion ?? 0),
          0,
        )
      : null;

    const logroMes = variaciones.get(input.periodoMes) ?? null;

    const metaMes = metasPorMes.get(input.periodoMes) ?? 0;

    const porcentaje = (valor: number, base: number): number | null =>
      base === 0 ? null : (valor / base) * 100;

    return {
      resumen: {
        metaAnual,
        cifraEsperada,

        avanceEsperado: porcentaje(cifraEsperada, metaAnual),

        llevan,

        cumplimientoEsperado:
          llevan === null ? null : porcentaje(llevan, cifraEsperada),

        cumplimientoMetaAnual:
          llevan === null ? null : porcentaje(llevan, metaAnual),

        diferenciaEsperado: llevan === null ? null : llevan - cifraEsperada,
      },

      mensual: {
        meta: metaMes,
        logro: logroMes,

        cumplimiento: logroMes === null ? null : porcentaje(logroMes, metaMes),

        diferencia: logroMes === null ? null : logroMes - metaMes,
      },

      comportamiento: Array.from({ length: 12 }, (_, index) => {
        const mes = index + 1;

        return {
          mes,
          meta: metasPorMes.get(mes) ?? 0,

          logro:
            mes <= input.periodoMes ? (variaciones.get(mes) ?? null) : null,
        };
      }),
    };
  }
}
