// src/common/excel/excel.service.ts
import * as fs from 'fs';
import { Injectable, Logger } from '@nestjs/common';

import * as XLSX from 'xlsx';
import axios from 'axios'
import { FileUpload } from 'graphql-upload-ts';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

import { envs } from 'src/config';

@Injectable()
export class ExcelService {

  private readonly logger = new Logger('ExcelService')

  private readonly s3 = new S3Client({
    region: envs.awsS3Region,
    credentials: {
      accessKeyId: envs.awsAccessKeyId,
      secretAccessKey: envs.awsSecretAccessKey,
    }
  })
  private readonly bucket = envs.awsS3BucketName;

  /**
   * 📤 Lee un archivo Excel (FileUpload) desde GraphQL Upload
   * y lo convierte en un arreglo JSON.
   */
  async readExcelAsJson(file: FileUpload): Promise<any[]> {
    if (!file) {
      throw new Error('Archivo no recibido. Verifica el frontend.');
    }

    const { createReadStream, mimetype } = file;

    if (!mimetype.includes('spreadsheetml')) {
      throw new Error(`Formato de archivo inválido (${mimetype}). Solo se permiten archivos Excel.`);
    }

    const stream = createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

    if (!json || json.length === 0) {
      throw new Error('El archivo Excel no contiene datos.');
    }

    return json;
  }

  /**
   * 📘 Lee un archivo Excel directamente desde una ruta en disco
   * y lo convierte en un arreglo JSON.
   */
  async readExcelAsJsonFromPath(path: string): Promise<any[]> {
    if (!path || !fs.existsSync(path)) {
      throw new Error(`El archivo no existe en la ruta especificada: ${path}`);
    }

    // Leer archivo Excel desde disco
    const workbook = XLSX.readFile(path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error('No se encontró ninguna hoja válida en el archivo Excel.');
    }

    // Convertir hoja a JSON
    const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

    if (!json || json.length === 0) {
      throw new Error('El archivo Excel no contiene datos.');
    }

    return json;
  }

  async readExcelAsJsonFromUrl(url: string): Promise<any[]> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

    if (!json || json.length === 0) {
      throw new Error('El archivo Excel no contiene datos.');
    }

    return json;
  }

  async readExcelAsJsonFromS3(key: string): Promise<any[]> {
    this.logger.log(`📥 Descargando Excel desde S3: ${key}`);

    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!json || json.length === 0) {
        throw new Error('El archivo Excel está vacío.');
      }

      return json;
    } catch (error) {
      this.logger.error(`❌ Error leyendo Excel desde S3: ${error.message}`);
      throw error;
    }
  }

  async readExcelAsRowsFromS3(key: string): Promise<unknown[][]> {
    this.logger.log(`📥 Descargando Excel desde S3: ${key}`);

    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      if (!response.Body) {
        throw new Error('El archivo descargado desde S3 no contiene datos.');
      }

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);

      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellDates: true,
      });

      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error('El archivo Excel no contiene hojas.');
      }

      const sheet = workbook.Sheets[sheetName];

      if (!sheet) {
        throw new Error('No se encontró una hoja válida en el archivo Excel.');
      }

      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        blankrows: false,
        raw: true,
      });

      if (!rows.length) {
        throw new Error('El archivo Excel está vacío.');
      }

      return rows;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(
        `❌ Error leyendo Excel desde S3: ${message}`,
      );

      throw error;
    }
  }

  /**
   * 📊 Construye un archivo Excel (Buffer) a partir de un arreglo de objetos
   */
  buildExcelBuffer(params: {
    rows: any[];
    sheetName?: string;
    headers?: string[];
    columnWidths?: number[];
  }): Buffer {

    const {
      rows,
      sheetName = 'Sheet1',
      headers,
      columnWidths,
    } = params;

    if (!rows || rows.length === 0) {
      throw new Error('No hay datos para generar el archivo Excel.');
    }

    const worksheet = XLSX.utils.json_to_sheet(
      rows,
      headers ? { header: headers } : undefined
    );

    // Ajuste de ancho de columnas (opcional)
    if (columnWidths?.length) {
      worksheet['!cols'] = columnWidths.map(w => ({ wch: w }));
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
  }

}
