import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { OP_META_AREA, PrismaClient } from '@prisma/client';

import {
  MetaColocacionPersistencia,
  MetaColocacionSucursalExcel,
  MetaMesNumero,
} from './types/meta-colocacion.types';
import { normalizeSucursalName } from './utils/meta-sucursal.util';
import { UploadMetasColocacionInput } from './dto/inputs/upload-metas-colocacion.input';
import { ExcelService } from '../../../common/excel/services/excel.service';
import { MetasExcelUtil } from './utils/metas-excel.util';

@Injectable()
export class MetasService extends PrismaClient implements OnModuleInit {
  private readonly _logger = new Logger('MetasService');

  constructor(
    private readonly _excelService: ExcelService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this._logger.log('Database connected');
  }

  public async uploadMetasColocacion(
    input: UploadMetasColocacionInput,
  ) {
    try {

      if (input.area !== OP_META_AREA.CREDITO) {
        throw new RpcException({
          message: `La carga de metas para el área ${input.area} aún no está soportada.`,
          status: HttpStatus.BAD_REQUEST,
        });
      }

      // Leer el Excel directamente desde S3.
      const excelRows =
        await this._excelService.readExcelAsRowsFromS3(input.s3Key);

      // Validar estructura, montos y totales del archivo.
      const parsed = MetasExcelUtil.parse(excelRows);

      // Resolver una sola vez cada sucursal contra R11Sucursal
      // y convertir las metas a una fila por mes.
      const metas = await this._resolveSucursales(
        input.cooperativaId,
        parsed.sucursales,
      );

      // Guardar toda la carga de forma atómica.
      const result = await this.$transaction(async (tx) => {
        const controlExistente = await tx.oP00ControlMetaColocacion.findUnique({
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

        let controlId: number;

        if (controlExistente) {
          controlId = controlExistente.OP00Id;

          // Actualizar metadata de la carga.
          await tx.oP00ControlMetaColocacion.update({
            where: {
              OP00Id: controlId,
            },
            data: {
              OP00Archivo: input.s3Key,
              OP00FechaCarga: new Date(),
            },
          });

          // Reemplazar por completo las metas anteriores del ejercicio.
          await tx.oP01MetaColocacion.deleteMany({
            where: {
              OP01ControlId: controlId,
            },
          });
        } else {
          const control = await tx.oP00ControlMetaColocacion.create({
            data: {
              OP00CooperativaCodigo: input.cooperativaId,
              OP00PeriodoAnio: input.periodoAnio,
              OP00Area: OP_META_AREA.CREDITO,
              OP00Archivo: input.s3Key,
            },
            select: {
              OP00Id: true,
            },
          });

          controlId = control.OP00Id;
        }

        await tx.oP01MetaColocacion.createMany({
          data: metas.map((meta) => ({
            OP01ControlId: controlId,
            OP01SucursalNumero: meta.sucursalNumero,
            OP01PeriodoMes: meta.periodoMes,
            OP01Meta: meta.meta,
          })),
        });

        return {
          controlId,
          metasRegistradas: metas.length,
        };
      });

      this._logger.log(
        `Metas registradas. Área: ${OP_META_AREA.CREDITO}, ` +
          `Cooperativa: ${input.cooperativaId}, ` +
          `Año: ${input.periodoAnio}, ` +
          `Registros: ${result.metasRegistradas}`,
      );

      return {
        message: 'Metas de crédito registradas correctamente.',
        controlId: result.controlId,
        metasRegistradas: result.metasRegistradas,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al procesar las metas de crédito.';

      this._logger.error(
        `Error al registrar metas de crédito: ${message}`,
      );

      throw new RpcException({
        message,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async _resolveSucursales(
    cooperativaId: string,
    sucursalesExcel: MetaColocacionSucursalExcel[],
  ): Promise<MetaColocacionPersistencia[]> {
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

    const sucursalesMap = new Map<string, string>();

    for (const sucursal of sucursalesDb) {
      const key = normalizeSucursalName(sucursal.R11Nom);

      if (sucursalesMap.has(key)) {
        throw new RpcException({
          message:
            `Existen sucursales con nombres duplicados o equivalentes ` +
            `en la cooperativa: "${sucursal.R11Nom}".`,
          status: HttpStatus.BAD_REQUEST,
        });
      }

      sucursalesMap.set(key, sucursal.R11NumSuc);
    }

    const metas: MetaColocacionPersistencia[] = [];

    for (const sucursalExcel of sucursalesExcel) {
      const sucursalNumero = sucursalesMap.get(
        normalizeSucursalName(sucursalExcel.sucursalNombre),
      );

      if (!sucursalNumero) {
        throw new RpcException({
          message:
            `La sucursal "${sucursalExcel.sucursalNombre}" ` +
            'no existe en la cooperativa.',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      for (let mes = 1; mes <= 12; mes++) {
        const periodoMes = mes as MetaMesNumero;

        metas.push({
          sucursalNumero,
          periodoMes,
          meta: sucursalExcel.metas[periodoMes],
        });
      }
    }

    return metas;
  }
}
