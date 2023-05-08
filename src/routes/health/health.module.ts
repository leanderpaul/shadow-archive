/**
 * Importing npm packages
 */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { NestLogger } from '@app/providers/logger';

import { HealthController } from './health.controller';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [TerminusModule.forRoot({ logger: NestLogger }), HttpModule],
  controllers: [HealthController],
  providers: [ContextService],
})
export class HealthModule {}
