import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  NATS_SERVERS: string[];
  AWS_S3_BUCKET_NAME: string;
  AWS_S3_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    AWS_S3_BUCKET_NAME: joi.string().required(),
    AWS_S3_REGION: joi.string().required(),
    AWS_ACCESS_KEY_ID: joi.string().required(),
    AWS_SECRET_ACCESS_KEY: joi.string().required(),

    NATS_SERVERS: joi.array().items(joi.string()).required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  databseUrl: envVars.DATABASE_URL,
  jwtSecret: envVars.JWT_SECRET,
  awsS3BucketName: envVars.AWS_S3_BUCKET_NAME,
  awsS3Region: envVars.AWS_S3_REGION,
  awsAccessKeyId: envVars.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,

  natServers: envVars.NATS_SERVERS,
};
