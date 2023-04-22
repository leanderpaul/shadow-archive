/**
 * Importing npm packages
 */
import { ConfigModule as NestConfigModule } from '@nestjs/config';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

export type ConfigRecord = typeof configs;

type ConfigKeys = keyof ConfigRecord;

type NodeEnv = 'production' | 'development' | 'test';

type LogLevel = 'silly' | 'debug' | 'http' | 'info' | 'warn' | 'error';

/**
 * Declaring the constants
 */
const secretKeyValidator = (value: string) => (Buffer.from(value, 'base64').length === 32 ? Buffer.from(value, 'base64') : false);

function setEnvConfig(name: string, defaultValue: string, isProdRequried?: boolean, validator?: (value: string) => boolean): string;
function setEnvConfig(name: string, defaultValue?: string | null, isProdRequried?: boolean, validator?: (value: string) => boolean): string | null;
function setEnvConfig(name: string, defaultValue?: string | null, isProdRequried = false, validator?: (value: string) => boolean) {
  let value = process.env[name];
  if (!value) {
    const isProdRequired = process.env.NODE_ENV === 'production' && isProdRequried;
    if (isProdRequired) throw new Error(`Environment Variable '${name}' not set`);
    else if (defaultValue) value = defaultValue;
  }
  if (!value && defaultValue !== null) throw new Error(`Environment Variable '${name}' not set`);
  if (validator && value && !validator(value)) throw new Error(`Environment Variable '${name}' is invalid`);
  process.env['ENV:' + name] = value;
  if (name === 'NODE_ENV' && value) process.env[name] = value;
  else delete process.env[name];
  return value ?? null;
}

function setTypedEnvConfig(name: string, type: 'number', defaultValue: number, isProdRequried?: boolean): number;
function setTypedEnvConfig(name: string, type: 'number', defaultValue?: number, isProdRequried?: boolean): number | null;
function setTypedEnvConfig(name: string, type: 'boolean', defaultValue: boolean, isProdRequried?: boolean): boolean;
function setTypedEnvConfig(name: string, type: 'boolean', defaultValue?: boolean, isProdRequried?: boolean): boolean | null;
function setTypedEnvConfig(name: string, type: 'number' | 'boolean', defaultValue?: number | boolean, isProdRequried = false): number | boolean | null {
  const value = process.env[name];
  const isProdRequired = process.env.NODE_ENV === 'production' && isProdRequried;
  if (!value && isProdRequired) throw new Error(`Environment Variable '${name}' not set`);
  const typedValue = !value ? defaultValue : type === 'number' ? Number(value) : Boolean(value);
  if (typedValue === undefined) throw new Error(`Environment Variable '${name}' not set`);
  if (!typedValue) throw new Error(`Environment Variable '${name}' is invalid`);
  process.env['ENV:' + name] = String(typedValue);
  delete process.env[name];
  return typedValue ?? null;
}

function setComplexEnvConfig<T>(name: string, validator: (value: string) => T | false, defaultValue?: string | null, isProdRequried?: boolean): T;
function setComplexEnvConfig<T>(name: string, validator: (value: string) => T | false, defaultValue?: string | null, isProdRequried?: boolean): T | null;
function setComplexEnvConfig<T>(name: string, validator: (value: string) => T | false, defaultValue?: string | null, isProdRequried = false) {
  const validate = (value: string) => validator(value) !== false;
  const value = setEnvConfig(name, defaultValue, isProdRequried, validate);
  const typedValue = value ? validator(value) : null;
  return typedValue as T | null;
}

const configs = {
  /** Handling Node Environment Variables */
  NODE_ENV: setEnvConfig('NODE_ENV', 'development') as NodeEnv,
  IS_DEV_SERVER: setEnvConfig('NODE_ENV') === 'development',
  IS_PROD_SERVER: setEnvConfig('NODE_ENV') === 'production',
  IS_TEST_SERVER: setEnvConfig('NODE_ENV') === 'test',

  APP_NAME: setEnvConfig('APP_NAME', 'shadow-archive'),

  /** Handling Logger Environment Variables */
  LOG_LEVEL: setEnvConfig('LOG_LEVEL', 'http', false, value => ['silly', 'debug', 'http', 'info', 'warn', 'error'].includes(value)) as LogLevel,
  LOG_DIR: setEnvConfig('LOG_DIR', 'logs'),

  /** Handling Database Environment Variables */
  DB_URI: setEnvConfig('DB_URI', 'mongodb://localhost/shadow', true),

  /** Third party service API Keys */
  LOGTAIL_SOURCE_TOKEN: setEnvConfig('LOGTAIL_SOURCE_TOKEN', null, true),
  SENDGRID_API_KEY: setEnvConfig('SENDGRID_API_KEY', null, true),

  /** Handling Server Environment Variables */
  HOST_NAME: setEnvConfig('HOST_NAME', '0.0.0.0'),
  PORT: setTypedEnvConfig('PORT', 'number', 8080),
  DOMAIN: setEnvConfig('DOMAIN', 'shadow-apps.com'),

  /** Handling Auth Environment Variables */
  COOKIE_NAME: setEnvConfig('COOKIE_NAME', 'sasid'),
  COOKIE_MAX_AGE: setTypedEnvConfig('COOKIE_MAX_AGE', 'number', 10 * 24 * 60 * 60),
  CSRF_TOKEN_NAME: setEnvConfig('CSRF_TOKEN_NAME', 'csrf'),
  CSRF_TOKEN_MAX_AGE: setTypedEnvConfig('CSRF_TOKEN_MAX_AGE', 'number', 10 * 60),

  /** Handling Secret Key Environment Variables */
  CSRF_SECRET_KEY: setComplexEnvConfig('CSRF_SECRET_KEY', secretKeyValidator, 'wiJVTyl+XrTOm5SBbZxs0o8QdSLljAFRV7F01D9bFKA=', true),
  REFRESH_TOKEN_SECRET_KEY: setComplexEnvConfig('REFRESH_TOKEN_SECRET_KEY', secretKeyValidator, 'IPYNiQFG8Q4URcbSyjwXDgWG6pnjDuLhDpGV9ybKgU0=', true),
} as const;

export const Config = {
  get<T extends ConfigRecord, K extends ConfigKeys>(key: K) {
    return configs[key] as T[K];
  },

  getAppName() {
    return configs.APP_NAME;
  },

  getNodeEnv() {
    return configs.NODE_ENV as 'development' | 'production' | 'test';
  },

  getCookieName() {
    return configs.COOKIE_NAME;
  },

  getSecretKey(name: 'CSRF' | 'REFRESH_TOKEN') {
    return name === 'CSRF' ? configs.CSRF_SECRET_KEY : configs.REFRESH_TOKEN_SECRET_KEY;
  },

  getMaxAge(name: 'COOKIE' | 'CSRF_TOKEN') {
    return name === 'COOKIE' ? configs.COOKIE_MAX_AGE : configs.CSRF_TOKEN_MAX_AGE;
  },

  getLog(name: 'LEVEL' | 'DIR') {
    return name === 'LEVEL' ? configs.LOG_LEVEL : configs.LOG_DIR;
  },
};

export const ConfigModule = NestConfigModule.forRoot({ isGlobal: true, load: [() => configs], ignoreEnvFile: true });
