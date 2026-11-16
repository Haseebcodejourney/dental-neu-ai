import { ensureDatabaseExists } from './ensure-database';

describe('ensureDatabaseExists', () => {
  it('skips CREATE when database already exists', async () => {
    const end = jest.fn().mockResolvedValue(undefined);
    const query = jest.fn().mockResolvedValueOnce({ rowCount: 1 });
    const connect = jest.fn().mockResolvedValue(undefined);
    const createClient = jest.fn().mockReturnValue({ connect, query, end });

    const result = await ensureDatabaseExists(
      {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'dental_neu_ai',
        ssl: false,
      },
      createClient,
    );

    expect(result).toEqual({ created: false, database: 'dental_neu_ai' });
    expect(query).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalled();
  });

  it('creates the database when missing', async () => {
    const end = jest.fn().mockResolvedValue(undefined);
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: null });
    const connect = jest.fn().mockResolvedValue(undefined);
    const createClient = jest.fn().mockReturnValue({ connect, query, end });

    const result = await ensureDatabaseExists(
      {
        host: 'db.example',
        port: 5432,
        user: 'admin',
        password: 'secret',
        database: 'dental_neu_ai',
        ssl: true,
      },
      createClient,
    );

    expect(result.created).toBe(true);
    expect(query).toHaveBeenNthCalledWith(2, 'CREATE DATABASE dental_neu_ai');
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
      }),
    );
  });
});
