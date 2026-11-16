import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  database?: {
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
  };
};

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(pingDb = false): Promise<HealthStatus> {
    const base: HealthStatus = {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
    };

    if (!pingDb) {
      return base;
    }

    const started = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        ...base,
        database: {
          status: 'up',
          latencyMs: Date.now() - started,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      return {
        status: 'degraded',
        uptimeSeconds: base.uptimeSeconds,
        database: {
          status: 'down',
          latencyMs: Date.now() - started,
          error: message,
        },
      };
    }
  }
}
