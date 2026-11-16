import { Controller, Get, Query } from '@nestjs/common';
import { HealthService, HealthStatus } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /health
   * GET /health?db=true — also pings PostgreSQL
   */
  @Get()
  check(@Query('db') db?: string): Promise<HealthStatus> {
    const pingDb = db === 'true' || db === '1';
    return this.healthService.check(pingDb);
  }
}
