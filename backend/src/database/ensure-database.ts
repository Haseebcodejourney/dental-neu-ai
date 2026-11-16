import { Logger } from '@nestjs/common';
import { Client, type ClientConfig } from 'pg';
import { assertSafeDatabaseName } from './database-name';

export type EnsureDatabaseOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  /** DB used only to create the app DB (Aurora/Postgres default). */
  maintenanceDatabase?: string;
};

export type EnsureDatabaseResult = {
  created: boolean;
  database: string;
};

type PgClientLike = {
  connect(): Promise<unknown>;
  query(text: string, values?: unknown[]): Promise<{ rowCount: number | null }>;
  end(): Promise<void>;
};

type ClientFactory = (config: ClientConfig) => PgClientLike;

/**
 * Connect to the maintenance database (`postgres` by default), create
 * `DATABASE_NAME` if missing, then return. Idempotent and safe for boot.
 */
export async function ensureDatabaseExists(
  options: EnsureDatabaseOptions,
  createClient: ClientFactory = (config) => new Client(config),
): Promise<EnsureDatabaseResult> {
  const logger = new Logger('EnsureDatabase');
  const database = options.database;
  assertSafeDatabaseName(database);

  const maintenanceDatabase = options.maintenanceDatabase ?? 'postgres';
  assertSafeDatabaseName(maintenanceDatabase);

  if (database === maintenanceDatabase) {
    logger.log(
      `DATABASE_NAME is "${database}" (maintenance DB); skip CREATE DATABASE`,
    );
    return { created: false, database };
  }

  const client = createClient({
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: maintenanceDatabase,
    ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15_000,
  });

  await client.connect();
  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );

    if ((existing.rowCount ?? 0) > 0) {
      logger.log(`Database "${database}" already exists`);
      return { created: false, database };
    }

    // Identifier validated above; CREATE DATABASE cannot take a bind param.
    await client.query(`CREATE DATABASE ${database}`);
    logger.log(`Created database "${database}"`);
    return { created: true, database };
  } finally {
    await client.end();
  }
}
