/**
 * Importing npm packages
 */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

/**
 * Importing user defined packages
 */
import { HealthController } from './health.controller';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [TerminusModule.forRoot({ logger: false }), HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
