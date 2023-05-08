/**
 * Importing npm packages
 */
import { Controller, Get, Res, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, MongooseHealthIndicator } from '@nestjs/terminus';
import { FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly contextService: ContextService,
  ) {}

  @Get()
  @HealthCheck()
  async check(@Res() res: FastifyReply) {
    this.contextService.set('DISABLE_REQUEST_LOGGING', true);
    try {
      const result = await this.health.check([
        () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
        () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.mongoose.pingCheck('database'),
      ]);
      return res.send(result);
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableException) return res.status(err.getStatus()).send(err.getResponse());
      throw err;
    }
  }
}
