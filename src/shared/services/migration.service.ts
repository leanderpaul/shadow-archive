/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Importing user defined packages
 */
import { DatabaseService } from '@app/modules/database';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode, NeverError } from '@app/shared/errors';

import { Storage } from './storage.service';

/**
 * Defining types
 */

export enum MigrationStatus {
  DISABLED = 'DISABLED',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
}

export enum MigrationMode {
  DRY = 'DRY',
  LIVE = 'LIVE',
}

/**
 * Declaring the constants
 */

@Injectable()
export class MigrationService {
  private readonly logger = Logger.getLogger(MigrationService.name);
  /** Add name to enable migration */
  private readonly name = '';

  private mode?: MigrationMode;
  private status = MigrationStatus.DISABLED;
  private error?: string;
  private progress = -1;

  constructor() {
    if (this.name) {
      this.status = MigrationStatus.PENDING;
      this.progress = 0;
    }
  }

  getName(): string | undefined {
    return this.name || undefined;
  }

  getStatus(): MigrationStatus {
    return this.status;
  }

  getMode(): MigrationMode | undefined {
    return this.mode;
  }

  getError(): string | undefined {
    return this.error;
  }

  getProgress(): number {
    return this.progress;
  }

  run(mode: MigrationMode = MigrationMode.DRY): void {
    if (this.status === MigrationStatus.DISABLED) throw new AppError(ErrorCode.MIG001);
    if (this.status === MigrationStatus.RUNNING) throw new AppError(ErrorCode.MIG002);
    this.mode = mode;
    this.status = MigrationStatus.RUNNING;
    const app = Storage.get<NestFastifyApplication>('app');
    if (!app) throw new NeverError('Nest application not initialized');
    this.migrate(app)
      .then(() => {
        this.logger.info('Migration completed');
        this.progress = 100;
        this.status = MigrationStatus.COMPLETED;
      })
      .catch(error => {
        this.logger.error(error);
        this.progress = -1;
        this.error = error.stack ?? error.toString();
      });
  }

  private async migrate(app: NestFastifyApplication): Promise<void> {
    const databaseService = app.get(DatabaseService);
    databaseService.getUserModel();
    for (let index = 1; index <= 100; index++) {
      this.progress = index;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
