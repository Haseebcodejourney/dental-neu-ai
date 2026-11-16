import { HealthService } from './health.service';

describe('HealthService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  let service: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthService(dataSource as never);
  });

  it('returns ok without DB ping', async () => {
    const result = await service.check(false);
    expect(result.status).toBe('ok');
    expect(result.database).toBeUndefined();
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('reports database up when ping succeeds', async () => {
    dataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]);
    const result = await service.check(true);
    expect(result.status).toBe('ok');
    expect(result.database?.status).toBe('up');
    expect(typeof result.database?.latencyMs).toBe('number');
  });

  it('reports degraded when ping fails', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection refused'));
    const result = await service.check(true);
    expect(result.status).toBe('degraded');
    expect(result.database?.status).toBe('down');
    expect(result.database?.error).toContain('connection refused');
  });
});
