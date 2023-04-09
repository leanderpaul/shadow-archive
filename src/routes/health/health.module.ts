/**
 * Importing npm packages
 */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

/**
 * Importing user defined packages
 */
import { NestLogger } from '@app/providers';

import { HealthController } from './health.controller';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [TerminusModule.forRoot({ logger: NestLogger }), HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
