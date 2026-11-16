const truthy = (value: string | undefined, fallback = false) => {
  if (value === undefined || value === '') {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  /** Explicit schema sync override (also on when NODE_ENV !== production). */
  syncSchema: truthy(process.env.SYNC_SCHEMA, false),
  mlServiceUrl: process.env.ML_SERVICE_URL ?? 'http://localhost:8000',
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    name: process.env.DATABASE_NAME ?? 'dental_neu_ai',
    ssl: truthy(process.env.DATABASE_SSL, false),
    /** Create DATABASE_NAME via maintenance DB when missing (default on). */
    ensure: truthy(process.env.DATABASE_ENSURE, true),
    maintenanceName: process.env.DATABASE_MAINTENANCE_NAME ?? 'postgres',
  },
});
