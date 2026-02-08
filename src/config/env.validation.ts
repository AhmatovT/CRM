import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().min(20).required(),
  JWT_REFRESH_SECRET: Joi.string().min(20).required(),
  REFRESH_HASH_PEPPER: Joi.string().min(10).required(),

  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: Joi.number().integer().min(1).max(365).default(30),

  REFRESH_COOKIE_NAME: Joi.string().default('refresh_token'),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),

  INVITE_TOKEN_PEPPER: Joi.string().min(16).required(),

  THROTTLE_TTL_SECONDS: Joi.number().integer().min(1).max(3600).default(60),
  THROTTLE_LIMIT_DEFAULT: Joi.number().integer().min(1).max(10000).default(120),
  THROTTLE_LIMIT_LOGIN: Joi.number().integer().min(1).max(1000).default(8),
  THROTTLE_LIMIT_REFRESH: Joi.number().integer().min(1).max(5000).default(30),
});
