import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';
import { OP_META_AREA, PrismaClient } from '@prisma/client';

import { ExcelService } from '../../../common/excel/services/excel.service';

import { normalizeSucursalName } from '../../common/utils/meta-sucursal.util';

import {
  MetaAfiliacionHojaParsed,
  MetaAfiliacionMesNumero,
} from './types/metas-afiliacion.types';

import { MetasAfiliacionExcelUtil } from './utils/metas-afiliacion-excel.util';

import { UploadMetasAfiliacionInput } from './dto/inputs/upload-metas-afiliacion.input';

interface MetaAfiliacionPersistencia {
  sucursalNumero: string;
  periodoMes: number;
  meta: number;
}

@Injectable()
export class MetasAfiliacionService extends PrismaClient implements OnModuleInit {

  private readonly _logger = new Logger(MetasAfiliacionService.name);

  constructor(private readonly _excelService: ExcelService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this._logger.log('Database connected');
  }

  public async uploadMetasAfiliacion(input: UploadMetasAfiliacionInput) {
    try {
      // 1. Descargar y leer ambas hojas.
      const sheets = await this._excelService.readExcelSheetsAsRowsFromS3(
        input.s3Key,
        ['Meta Integral', 'Meta Ahorradores'],
      );

      // 2. Validar completamente el Excel.
      const parsed = MetasAfiliacionExcelUtil.parse(sheets);

      // 3. Consultar las sucursales de la cooperativa.
      const sucursalesDb = await this.r11Sucursal.findMany({
        where: {
          R11Coop_id: input.cooperativaId,
        },
        select: {
          R11NumSuc: true,
          R11Nom: true,
        },
      });

      if (!sucursalesDb.length) {
        throw new RpcException({
          message: 'La cooperativa no tiene sucursales registradas.',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      // 4. Construir el mapa de nombres normalizados.
      const sucursalesMap = new Map<string, string>();

      for (const sucursal of sucursalesDb) {
        const key = normalizeSucursalName(sucursal.R11Nom);

        if (sucursalesMap.has(key)) {
          throw new RpcException({
            message:
              'Existen sucursales con nombres duplicados ' +
              `o equivalentes: "${sucursal.R11Nom}".`,
            status: HttpStatus.BAD_REQUEST,
          });
        }

        sucursalesMap.set(key, sucursal.R11NumSuc);
      }

      // 5. Resolver ambas hojas antes de la transacción.
      const metasIntegral = this._resolveMetas(
        parsed.integral,
        sucursalesMap,
        'Meta Integral',
      );

      const metasAhorradorMenor = this._resolveMetas(
        parsed.ahorradorMenor,
        sucursalesMap,
        'Meta Ahorradores',
      );

      // 6. Persistir ambas tablas de forma atómica.
      const result = await this.$transaction(async (tx) => {
        const controlWhere = {
          OP00CooperativaCodigo_OP00PeriodoAnio_OP00Area: {
            OP00CooperativaCodigo: input.cooperativaId,
            OP00PeriodoAnio: input.periodoAnio,
            OP00Area: OP_META_AREA.AFILIACION,
          },
        };

        const control = await tx.oP00ControlMeta.upsert({
          where: controlWhere,
          create: {
            OP00CooperativaCodigo: input.cooperativaId,
            OP00PeriodoAnio: input.periodoAnio,
            OP00Area: OP_META_AREA.AFILIACION,
            OP00Archivo: input.s3Key,
          },
          update: {
            OP00Archivo: input.s3Key,
            OP00FechaCarga: new Date(),
          },
          select: {
            OP00Id: true,
          },
        });

        const controlId = control.OP00Id;

        // Reemplazo completo de ambas tablas.
        await tx.oP04MetaIntegral.deleteMany({
          where: {
            OP04ControlId: controlId,
          },
        });

        await tx.oP05MetaAhorradorMenor.deleteMany({
          where: {
            OP05ControlId: controlId,
          },
        });

        await tx.oP04MetaIntegral.createMany({
          data: metasIntegral.map((meta) => ({
            OP04ControlId: controlId,
            OP04SucursalNumero: meta.sucursalNumero,
            OP04PeriodoMes: meta.periodoMes,
            OP04Meta: meta.meta,
          })),
        });

        await tx.oP05MetaAhorradorMenor.createMany({
          data: metasAhorradorMenor.map((meta) => ({
            OP05ControlId: controlId,
            OP05SucursalNumero: meta.sucursalNumero,
            OP05PeriodoMes: meta.periodoMes,
            OP05Meta: meta.meta,
          })),
        });

        return {
          controlId,
          metasIntegralRegistradas: metasIntegral.length,
          metasAhorradorMenorRegistradas: metasAhorradorMenor.length,
        };
      });

      this._logger.log(
        `Metas de Afiliación registradas. ` +
          `Cooperativa: ${input.cooperativaId}, ` +
          `Año: ${input.periodoAnio}, ` +
          `Integral: ${result.metasIntegralRegistradas}, ` +
          `Ahorrador menor: ${result.metasAhorradorMenorRegistradas}`,
      );

      return {
        message: 'Metas de afiliación registradas correctamente.',
        ...result,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al procesar las metas de afiliación.';

      this._logger.error(`Error al registrar metas de afiliación: ${message}`);

      throw new RpcException({
        message,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private _resolveMetas(
    hoja: MetaAfiliacionHojaParsed,
    sucursalesMap: Map<string, string>,
    nombreHoja: string,
  ): MetaAfiliacionPersistencia[] {
    const metas: MetaAfiliacionPersistencia[] = [];

    for (const sucursal of hoja.sucursales) {
      const sucursalNumero = sucursalesMap.get(
        normalizeSucursalName(sucursal.sucursalNombre),
      );

      if (sucursalNumero === undefined) {
        throw new RpcException({
          message:
            `Hoja "${nombreHoja}": la sucursal ` +
            `"${sucursal.sucursalNombre}" ` +
            'no existe en la cooperativa.',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      for (let mes = 1; mes <= 12; mes++) {
        const periodoMes = mes as MetaAfiliacionMesNumero;

        metas.push({
          sucursalNumero,
          periodoMes,
          meta: sucursal.metas[periodoMes],
        });
      }
    }

    return metas;
  }
}
