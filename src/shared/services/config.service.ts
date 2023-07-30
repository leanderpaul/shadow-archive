/**
 * Importing npm packages
 */
import os from 'os';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

type NodeEnv = 'development' | 'production' | 'test';

type LogLevel = 'silly' | 'debug' | 'http' | 'info' | 'warn' | 'error';

type Nullable<T> = T | null;

export interface ConfigRecords {
  /** Application configs */
  'app.env': NodeEnv;
  'app.name': string;
  'app.hostname': string;
  'app.port': number;
  'app.domain': string;

  /** Log configs */
  'log.level': LogLevel;
  'log.dir': string;

  /** Database configs */
  'db.uri': string;

  /** Mail service configs */
  'mail.sendgrid.apikey': Nullable<string>;

  /** AWS configs */
  'aws.region': string;
  'aws.cloudwatch.log-group': string;
  'aws.cloudwatch.log-stream': string;
  'aws.cloudwatch.upload-rate': number;

  /** Authentication configs */
  'cookie.name': string;
  'cookie.max-age': number;
  'csrf.secret-key': Buffer;
  'refresh-token.secret-key': Buffer;
}

/**
 * Declaring the constants
 */
const isProd = process.env.NODE_ENV === 'production';
const validNodeEnvs = ['development', 'production', 'test'];
const validLogLevels = ['silly', 'debug', 'http', 'info', 'warn', 'error'];

class ConfigService {
  private readonly cache;

  static get(name: string, defaultValue: string, isProdRequried?: boolean, validator?: (value: string) => boolean): string;
  static get(name: string, defaultValue?: string | null, isProdRequried?: boolean, validator?: (value: string) => boolean): string | null;
  static get(name: string, defaultValue?: string | null, isProdRequried = false, validator?: (value: string) => boolean): string | null {
    let value = process.env[name];
    if (!value) {
      if (isProd && isProdRequried) throw new Error(`Environment Variable '${name}' not set`);
      else if (defaultValue) value = defaultValue;
    }
    if (!value && defaultValue !== null) throw new Error(`Environment Variable '${name}' not set`);
    if (validator && value && !validator(value)) throw new Error(`Environment Variable '${name}' is invalid`);
    return value ?? null;
  }

  static getTyped(name: string, type: 'number', defaultValue: number, isProdRequried?: boolean): number;
  static getTyped(name: string, type: 'number', defaultValue?: number, isProdRequried?: boolean): number | null;
  static getTyped(name: string, type: 'boolean', defaultValue: boolean, isProdRequried?: boolean): boolean;
  static getTyped(name: string, type: 'number' | 'boolean', defaultValue?: number | boolean, isProdRequried = false): number | boolean | null {
    const value = process.env[name];
    if (!value && isProd && isProdRequried) throw new Error(`Environment Variable '${name}' not set`);
    const typedValue = !value ? defaultValue : type === 'number' ? Number(value) : Boolean(value);
    if (typedValue === undefined) throw new Error(`Environment Variable '${name}' not set`);
    if (!typedValue) throw new Error(`Environment Variable '${name}' is invalid`);
    return typedValue ?? null;
  }

  static getComplexType<T>(name: string, validator: (value: string) => T | false, defaultValue?: string | null, isProdRequried?: boolean): T;
  static getComplexType<T>(name: string, validator: (value: string) => T | false, defaultValue?: string | null, isProdRequried?: boolean): T | null;
  static getComplexType<T>(name: string, validator: (value: string) => T | false, defaultValue?: string | null, isProdRequried = false): T | null {
    const validate = (value: string) => validator(value) !== false;
    const value = this.get(name, defaultValue, isProdRequried, validate);
    const typedValue = value ? validator(value) : null;
    return typedValue as T | null;
  }

  constructor() {
    const cache = new Map<keyof ConfigRecords, any>();
    this.cache = cache;

    const nodeEnv = ConfigService.get('NODE_ENV', 'development', false, value => validNodeEnvs.includes(value));
    cache.set('app.env', nodeEnv);
    const appName = ConfigService.get('APP_NAME', 'shadow-archive');
    cache.set('app.name', appName);
    const hostname = ConfigService.get('HOST_NAME', '0.0.0.0');
    cache.set('app.hostname', hostname);
    const port = ConfigService.getTyped('PORT', 'number', 8080);
    cache.set('app.port', port);
    const domain = ConfigService.get('DOMAIN', 'dev.shadow-apps.com');
    cache.set('app.domain', domain);

    const logLevel = ConfigService.get('LOG_LEVEL', 'http', false, value => validLogLevels.includes(value));
    cache.set('log.level', logLevel);
    const logDir = ConfigService.get('LOG_DIR', 'logs');
    cache.set('log.dir', logDir);

    const dburi = ConfigService.get('DB_URI', 'mongodb://localhost/shadow-database', true);
    cache.set('db.uri', dburi);

    const sendgridApikey = ConfigService.get('SENDGRID_API_KEY', null, true);
    cache.set('mail.sendgrid.apikey', sendgridApikey);

    const awsRegion = ConfigService.get('AWS_REGION', 'ap-south-1');
    cache.set('aws.region', awsRegion);
    const cloudwatchLogGroup = ConfigService.get('AWS_CLOUDWATCH_LOG_GROUP', 'shadow-archive');
    cache.set('aws.cloudwatch.log-group', cloudwatchLogGroup);
    const defaultLogStream = os.networkInterfaces().eth0?.find(info => info.family === 'IPv4')?.address ?? 'unknown-ip';
    const cloudwatchLogStream = ConfigService.get('AWS_CLOUDWATCH_LOG_STREAM', defaultLogStream);
    cache.set('aws.cloudwatch.log-stream', cloudwatchLogStream);
    const cloudwatchUploadRate = ConfigService.getTyped('AWS_CLOUDWATCH_UPLOAD_RATE', 'number', 2000);
    cache.set('aws.cloudwatch.upload-rate', cloudwatchUploadRate);

    const cookieName = ConfigService.get('COOKIE_NAME', 'sasid');
    cache.set('cookie.name', cookieName);
    const cookieMaxAge = ConfigService.getTyped('COOKIE_MAX_AGE', 'number', 10 * 24 * 60 * 60);
    cache.set('cookie.max-age', cookieMaxAge);

    const secretKeyValidator = (value: string): Buffer | false => (Buffer.from(value, 'base64').length === 32 ? Buffer.from(value, 'base64') : false);
    const csrfSecretKey = ConfigService.getComplexType('CSRF_SECRET_KEY', secretKeyValidator, 'wiJVTyl+XrTOm5SBbZxs0o8QdSLljAFRV7F01D9bFKA=', true);
    cache.set('csrf.secret-key', csrfSecretKey);
    const refreshTokenSecretKey = ConfigService.getComplexType('REFRESH_TOKEN_SECRET_KEY', secretKeyValidator, 'IPYNiQFG8Q4URcbSyjwXDgWG6pnjDuLhDpGV9ybKgU0=', true);
    cache.set('refresh-token.secret-key', refreshTokenSecretKey);
  }

  get<T extends keyof ConfigRecords>(key: T): ConfigRecords[T] {
    return this.cache.get(key);
  }

  getOrThrow<T extends keyof ConfigRecords>(key: T): Exclude<ConfigRecords[T], null> {
    const value = this.cache.get(key);
    if (value === null) throw new Error(`Expected config value for '${key}' to be set`);
    return value;
  }
}

const globalRef = global as any;
export const Config: ConfigService = globalRef.ConfigService || (globalRef.ConfigService = new ConfigService());
