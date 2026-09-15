import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { Prisma, PrismaClient } from '@prisma/client';
import { CreateUsuarioAliasInput } from './dto/inputs/create-usuario-alias.input';
import { UsuarioAliasOutput } from './dto/outputs/usuario-alias.output';
import {UsuarioAliasRow} from "./types";
import {UpdateUsuarioAliasInput} from "./dto/inputs/update-usuario-alias.input";
import {DeleteUsuarioAliasInput} from "./dto/inputs/delete-usuario-alias.input";
import {DeleteUsuarioAliasOutput} from "./dto/outputs/delete-usuario-alias.output";
import { GetUsuariosLogicosCandidatosInput } from './dto/inputs/get-usuarios-logicos-candidatos.input';
import { UsuarioLogicoCandidatoOutput } from './dto/outputs/usuario-logico-candidato.output';

@Injectable()
export class UsuariosAliasService extends PrismaClient implements OnModuleInit {
  private readonly _logger = new Logger('UsuariosAliasService');

  async onModuleInit(): Promise<void> {
    await this.$connect();

    this._logger.log('Database connected');
  }

  public async createAlias(
    input: CreateUsuarioAliasInput,
  ): Promise<UsuarioAliasOutput> {
    const { cooperativaId, codigoLogico, r12Ni } = input;

    if (codigoLogico === r12Ni) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario variante no puede ser igual al usuario lógico.',
      });
    }

    const usuarioVariante = await this.r12Usuario.findUnique({
      where: {
        R12Ni: r12Ni,
      },

      include: {
        sucursal: true,
      },
    });

    if (!usuarioVariante) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No se encontró el usuario variante.',
      });
    }

    if (usuarioVariante.R12Coop_id !== cooperativaId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario variante no pertenece a la cooperativa indicada.',
      });
    }

    if (usuarioVariante.sucursal.R11Coop_id !== cooperativaId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'La sucursal del usuario variante no pertenece a la cooperativa indicada.',
      });
    }

    const usuarioLogico = await this.r12Usuario.findUnique({
      where: {
        R12Ni: codigoLogico,
      },
    });

    if (!usuarioLogico) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No se encontró el usuario lógico indicado.',
      });
    }

    if (usuarioLogico.R12Coop_id !== cooperativaId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario lógico no pertenece a la cooperativa indicada.',
      });
    }

    const aliasExistente = await this.oP02UsuarioAlias.findUnique({
      where: {
        OP02CooperativaId_OP02R12Ni: {
          OP02CooperativaId: cooperativaId,

          OP02R12Ni: r12Ni,
        },
      },
    });

    if (aliasExistente) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'El usuario variante ya tiene una equivalencia configurada.',
      });
    }

    const alias = await this.oP02UsuarioAlias.create({
      data: {
        OP02CooperativaId: cooperativaId,

        OP02CodigoLogico: codigoLogico,

        OP02R12Ni: r12Ni,

        OP02SucursalNumero: usuarioVariante.sucursal.R11NumSuc,
      },
    });

    return {
      id: alias.OP02Id,

      cooperativaId: alias.OP02CooperativaId,

      codigoLogico: alias.OP02CodigoLogico,

      nombreLogico: usuarioLogico.R12Nom,

      r12Ni: alias.OP02R12Ni,

      nombreVariante: usuarioVariante.R12Nom,

      sucursalNumero: alias.OP02SucursalNumero,

      sucursalNombre: usuarioVariante.sucursal.R11Nom,

      creadoEn: alias.OP02CreadoEn.toISOString(),

      actualizadoEn: alias.OP02ActualizadoEn.toISOString(),
    };
  }

  public async getAliases(
    cooperativaId: string,
  ): Promise<UsuarioAliasOutput[]> {
    const rows = await this.$queryRaw<UsuarioAliasRow[]>(
      Prisma.sql`
        SELECT
          a."OP02Id"
            AS "id",

          a."OP02CooperativaId"
            AS "cooperativaId",

          a."OP02CodigoLogico"
            AS "codigoLogico",

          logico."R12Nom"
            AS "nombreLogico",

          a."OP02R12Ni"
            AS "r12Ni",

          variante."R12Nom"
            AS "nombreVariante",

          a."OP02SucursalNumero"
            AS "sucursalNumero",

          s."R11Nom"
            AS "sucursalNombre",

          a."OP02CreadoEn"
            AS "creadoEn",

          a."OP02ActualizadoEn"
            AS "actualizadoEn"

        FROM "OP02UsuarioAlias" a

        INNER JOIN "R12Usuario" variante
          ON variante."R12Ni" = a."OP02R12Ni"
          AND variante."R12Coop_id" =
              a."OP02CooperativaId"

        INNER JOIN "R12Usuario" logico
          ON logico."R12Ni" =
              a."OP02CodigoLogico"
          AND logico."R12Coop_id" =
              a."OP02CooperativaId"

        INNER JOIN "R11Sucursal" s
          ON s."R11NumSuc" =
              a."OP02SucursalNumero"
          AND s."R11Coop_id" =
              a."OP02CooperativaId"

        WHERE
          a."OP02CooperativaId" =
            ${cooperativaId}::uuid

        ORDER BY
          a."OP02CodigoLogico" ASC,
          a."OP02R12Ni" ASC
      `,
    );

    return rows.map((row) => ({
      id: row.id,

      cooperativaId: row.cooperativaId,

      codigoLogico: row.codigoLogico,

      nombreLogico: row.nombreLogico,

      r12Ni: row.r12Ni,

      nombreVariante: row.nombreVariante,

      sucursalNumero: row.sucursalNumero,

      sucursalNombre: row.sucursalNombre,

      creadoEn: row.creadoEn.toISOString(),

      actualizadoEn: row.actualizadoEn.toISOString(),
    }));
  }

  public async updateAlias(
    input: UpdateUsuarioAliasInput,
  ): Promise<UsuarioAliasOutput> {
    const { id, cooperativaId, codigoLogico } = input;

    const aliasExistente = await this.oP02UsuarioAlias.findFirst({
      where: {
        OP02Id: id,
        OP02CooperativaId: cooperativaId,
      },
    });

    if (!aliasExistente) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No se encontró la equivalencia indicada.',
      });
    }

    if (aliasExistente.OP02R12Ni === codigoLogico) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario variante no puede ser igual al usuario lógico.',
      });
    }

    const usuarioLogico = await this.r12Usuario.findUnique({
      where: {
        R12Ni: codigoLogico,
      },
    });

    if (!usuarioLogico) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No se encontró el usuario lógico indicado.',
      });
    }

    if (usuarioLogico.R12Coop_id !== cooperativaId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario lógico no pertenece a la cooperativa indicada.',
      });
    }

    const usuarioVariante = await this.r12Usuario.findUnique({
      where: {
        R12Ni: aliasExistente.OP02R12Ni,
      },

      include: {
        sucursal: true,
      },
    });

    if (!usuarioVariante) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          'No se encontró el usuario variante asociado a la equivalencia.',
      });
    }

    const alias = await this.oP02UsuarioAlias.update({
      where: {
        OP02Id: id,
      },

      data: {
        OP02CodigoLogico: codigoLogico,
      },
    });

    return {
      id: alias.OP02Id,

      cooperativaId: alias.OP02CooperativaId,

      codigoLogico: alias.OP02CodigoLogico,

      nombreLogico: usuarioLogico.R12Nom,

      r12Ni: alias.OP02R12Ni,

      nombreVariante: usuarioVariante.R12Nom,

      sucursalNumero: alias.OP02SucursalNumero,

      sucursalNombre: usuarioVariante.sucursal.R11Nom,

      creadoEn: alias.OP02CreadoEn.toISOString(),

      actualizadoEn: alias.OP02ActualizadoEn.toISOString(),
    };
  }

  public async deleteAlias(
    input: DeleteUsuarioAliasInput,
  ): Promise<DeleteUsuarioAliasOutput> {
    const { id, cooperativaId } = input;

    const alias = await this.oP02UsuarioAlias.findFirst({
      where: {
        OP02Id: id,
        OP02CooperativaId: cooperativaId,
      },
    });

    if (!alias) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No se encontró la equivalencia indicada.',
      });
    }

    await this.oP02UsuarioAlias.delete({
      where: {
        OP02Id: id,
      },
    });

    return {
      id,
      deleted: true,
    };
  }

  public async getUsuariosLogicosCandidatos(
    input: GetUsuariosLogicosCandidatosInput,
  ): Promise<UsuarioLogicoCandidatoOutput[]> {
    const { cooperativaId, r12Ni } = input;

    const usuarioVariante = await this.r12Usuario.findUnique({
      where: {
        R12Ni: r12Ni,
      },
    });

    if (!usuarioVariante) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No se encontró el usuario variante.',
      });
    }

    if (usuarioVariante.R12Coop_id !== cooperativaId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario variante no pertenece a la cooperativa indicada.',
      });
    }

    /*
     * La eliminación del último carácter se utiliza
     * exclusivamente como sugerencia.
     *
     * Ejemplo:
     * NI0119A -> NI0119
     *
     * No crea ni determina automáticamente una equivalencia.
     */
    const codigoLogicoSugerido = r12Ni.replace(/[A-Z]$/, '');

    const usuarios = await this.r12Usuario.findMany({
      where: {
        R12Coop_id: cooperativaId,

        R12Activ: true,

        R12Ni: {
          not: r12Ni,
        },
      },

      include: {
        sucursal: true,
      },

      orderBy: [
        {
          R12Nom: 'asc',
        },
        {
          R12Ni: 'asc',
        },
      ],
    });

    const candidatos: UsuarioLogicoCandidatoOutput[] = usuarios.map(
      (usuario) => ({
        r12Ni: usuario.R12Ni,

        nombre: usuario.R12Nom,

        rol: usuario.R12Rol,

        sucursalNumero: usuario.sucursal.R11NumSuc,

        sucursalNombre: usuario.sucursal.R11Nom,

        sugerido: usuario.R12Ni === codigoLogicoSugerido,
      }),
    );

    return candidatos.sort((a, b) => Number(b.sugerido) - Number(a.sugerido));
  }
}