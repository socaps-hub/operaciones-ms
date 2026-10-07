import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { OP_META_AREA, PrismaClient } from '@prisma/client';

import { MetasCaptacionExcelUtil } from './utils/metas-captacion-excel.util';

import {
  MetaCaptacionPersistencia,
  MetaCaptacionSucursalExcel,
} from './types/meta-captacion.types';
import { ExcelService } from '../../../common/excel/services/excel.service';
import { normalizeSucursalName } from '../../common/utils/meta-sucursal.util';
import { UploadMetasCaptacionInput } from './dto/inputs/upload-metas-captacion.input';
import { UploadMetasCaptacionOutput } from './dto/outputs/upload-metas-captacion.output';

@Injectable()
export class MetasCaptacionService
  extends PrismaClient
  implements OnModuleInit
{
  private readonly _logger = new Logger(MetasCaptacionService.name);

  constructor(private readonly _excelService: ExcelService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    this._logger.log('Database connected');
  }

  public async uploadMetasCaptacion(
    input: UploadMetasCaptacionInput,
  ): Promise<UploadMetasCaptacionOutput> {
    try {
      if (input.area !== OP_META_AREA.CAPTACION) {
        throw new RpcException({
          message: 'El área proporcionada no corresponde a CAPTACION.',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      /*
       * 1. Descargar y leer el Excel.
       */
      const excelRows = await this._excelService.readExcelAsRowsFromS3(
        input.s3Key,
      );

      /*
       * 2. Interpretar y validar completamente
       *    la estructura del archivo.
       *
       * En este punto todavía trabajamos con
       * nombres de sucursal.
       */
      const parsed = MetasCaptacionExcelUtil.parse(excelRows);

      /*
       * 3. Resolver los nombres del Excel
       *    contra R11Sucursal y obtener
       *    R11NumSuc.
       */
      const metas = await this._resolveSucursales(input.cooperativaId, parsed);

      /*
       * 4. Reemplazar atómicamente la carga
       *    correspondiente al año.
       */
      const result = await this.$transaction(async (tx) => {
        const existingControl = await tx.oP00ControlMeta.findUnique({
          where: {
            OP00CooperativaCodigo_OP00PeriodoAnio_OP00Area: {
              OP00CooperativaCodigo: input.cooperativaId,

              OP00PeriodoAnio: input.periodoAnio,

              OP00Area: OP_META_AREA.CAPTACION,
            },
          },
          select: {
            OP00Id: true,
          },
        });

        let controlId: number;

        if (existingControl) {
          controlId = existingControl.OP00Id;

          await tx.oP00ControlMeta.update({
            where: {
              OP00Id: controlId,
            },
            data: {
              OP00Archivo: input.s3Key,

              OP00FechaCarga: new Date(),
            },
          });

          await tx.oP02MetaCaptacion.deleteMany({
            where: {
              OP02ControlId: controlId,
            },
          });
        } else {
          const control = await tx.oP00ControlMeta.create({
            data: {
              OP00CooperativaCodigo: input.cooperativaId,

              OP00PeriodoAnio: input.periodoAnio,

              OP00Area: OP_META_AREA.CAPTACION,

              OP00Archivo: input.s3Key,
            },
            select: {
              OP00Id: true,
            },
          });

          controlId = control.OP00Id;
        }

        await tx.oP02MetaCaptacion.createMany({
          data: metas.map((meta) => ({
            OP02ControlId: controlId,

            OP02SucursalNumero: meta.sucursalNumero,

            OP02PeriodoMes: meta.periodoMes,

            OP02MetaVista: meta.metaVista,

            OP02MetaPlazo: meta.metaPlazo,

            OP02MetaInfantil: meta.metaInfantil,
          })),
        });

        return {
          controlId,
          metasRegistradas: metas.length,
        };
      });

      this._logger.log(
        `Metas de captación cargadas correctamente. ` +
          `Cooperativa: ${input.cooperativaId}. ` +
          `Año: ${input.periodoAnio}. ` +
          `Registros: ${result.metasRegistradas}.`,
      );

      return {
        message: 'Metas de captación cargadas correctamente.',
        controlId: result.controlId,
        metasRegistradas: result.metasRegistradas,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Error desconocido';

      this._logger.error(`Error cargando metas de captación: ${message}`);

      throw new RpcException({
        message: `No fue posible cargar las metas de captación. ${message}`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async _resolveSucursales(
    cooperativaId: string,
    sucursalesExcel: MetaCaptacionSucursalExcel[],
  ): Promise<MetaCaptacionPersistencia[]> {
    /*
     * Consultamos una sola vez todas las sucursales
     * de la cooperativa para evitar N+1.
     */
    const sucursalesDb = await this.r11Sucursal.findMany({
      where: {
        R11Coop_id: cooperativaId,
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

    /*
     * Índice por nombre normalizado.
     *
     * Ejemplos:
     * "Canatlán" -> "canatlan"
     * "CANATLÁN" -> "canatlan"
     * "Matriz"   -> "matriz"
     */
    const sucursalesMap = new Map<string, string>();

    for (const sucursal of sucursalesDb) {
      const normalizedName = normalizeSucursalName(sucursal.R11Nom);

      const sucursalNumero = String(sucursal.R11NumSuc);

      const existing = sucursalesMap.get(normalizedName);

      if (existing && existing !== sucursalNumero) {
        throw new RpcException({
          message:
            `Existen sucursales con nombres equivalentes ` +
            `después de normalizar: "${sucursal.R11Nom}".`,
          status: HttpStatus.BAD_REQUEST,
        });
      }

      sucursalesMap.set(normalizedName, sucursalNumero);
    }

    const metas: MetaCaptacionPersistencia[] = [];

    for (const sucursalExcel of sucursalesExcel) {
      const normalizedName = normalizeSucursalName(
        sucursalExcel.sucursalNombre,
      );

      /*
       * GLOBAL no representa una R11Sucursal.
       *
       * Se almacena con OP02SucursalNumero = null.
       */
      if (normalizedName === 'global') {
        for (const meta of sucursalExcel.metas) {
          metas.push({
            sucursalNumero: null,
            periodoMes: meta.mes,
            metaVista: meta.vista,
            metaPlazo: meta.plazo,
            metaInfantil: meta.infantil,
          });
        }

        continue;
      }

      /*
       * Para cualquier bloque que no sea Global,
       * exigimos correspondencia real con R11Sucursal.
       */
      const sucursalNumero = sucursalesMap.get(normalizedName);

      if (!sucursalNumero) {
        throw new RpcException({
          message:
            `La sucursal "${sucursalExcel.sucursalNombre}" ` +
            `del archivo no existe en R11Sucursal ` +
            `para la cooperativa seleccionada.`,
          status: HttpStatus.BAD_REQUEST,
        });
      }

      for (const meta of sucursalExcel.metas) {
        metas.push({
          sucursalNumero,
          periodoMes: meta.mes,
          metaVista: meta.vista,
          metaPlazo: meta.plazo,
          metaInfantil: meta.infantil,
        });
      }
    }

    return metas;
  }
}
