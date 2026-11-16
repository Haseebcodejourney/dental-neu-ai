/** PostgreSQL identifiers we allow for CREATE DATABASE (no quoting tricks). */
const SAFE_DB_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function assertSafeDatabaseName(name: string): void {
  if (!SAFE_DB_NAME.test(name)) {
    throw new Error(
      `Unsafe DATABASE_NAME "${name}". Use letters, digits, and underscore only.`,
    );
  }
}

/**
 * Schema sync policy:
 * - On when NODE_ENV !== 'production' (local/dev convenience)
 * - Or when SYNC_SCHEMA=true (explicit first-boot / recovery on Aurora)
 * Production without SYNC_SCHEMA should use TypeORM migrations instead.
 */
export function shouldSynchronizeSchema(
  nodeEnv: string | undefined,
  syncSchema: boolean,
): boolean {
  return (nodeEnv ?? 'development') !== 'production' || syncSchema;
}
