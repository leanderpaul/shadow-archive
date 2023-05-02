/**
 * Importing npm packages
 */
import { Controller, Get, Res, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, MongooseHealthIndicator } from '@nestjs/terminus';
import { FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService, private readonly memory: MemoryHealthIndicator, private readonly mongoose: MongooseHealthIndicator) {}

  @Get()
  @HealthCheck()
  async check(@Res() res: FastifyReply) {
    try {
      return await this.health.check([
        () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
        () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.mongoose.pingCheck('database'),
      ]);
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableException) return await res.status(503).send(err.getResponse());
      throw err;
    }
  }
}
