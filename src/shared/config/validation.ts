import Joi from 'joi';
import { DatabaseType, Env, NodeEnvironment } from './config.types';

export const envSchema = Joi.object<Env>({
  NODE_ENV: Joi.string<NodeEnvironment>()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  MONGO_URI: Joi.string()
    .uri({
      scheme: ['mongodb', 'mongodb+srv'],
    })
    .required()
    .messages({
      'any.required': 'MONGO_URI is required',
      'string.empty': 'MONGO_URI is required',
      'string.uri':
        'MONGO_URI must be a valid MongoDB connection string',
    }),

  MONGO_DB_NAME: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'any.required': 'MONGO_DB_NAME is required',
      'string.empty': 'MONGO_DB_NAME is required',
    }),

  POSTGRES_URL: Joi.string()
    .uri({
      scheme: ['postgres', 'postgresql'],
    })
    .required()
    .messages({
      'any.required': 'POSTGRES_URL is required',
      'string.empty': 'POSTGRES_URL is required',
      'string.uri':
        'POSTGRES_URL must be a valid PostgreSQL connection string',
    }),

  DATABASE: Joi.string<DatabaseType>()
    .valid('mongodb', 'postgres')
    .default('postgres')
    .messages({
      'any.only':
        'DATABASE must be either mongodb or postgres',
    }),
});
