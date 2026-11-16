import {
  assertSafeDatabaseName,
  shouldSynchronizeSchema,
} from './database-name';

describe('database-name helpers', () => {
  describe('assertSafeDatabaseName', () => {
    it('accepts dental_neu_ai', () => {
      expect(() => assertSafeDatabaseName('dental_neu_ai')).not.toThrow();
    });

    it('rejects injection-like names', () => {
      expect(() =>
        assertSafeDatabaseName('dental_neu_ai; drop database postgres'),
      ).toThrow(/Unsafe DATABASE_NAME/);
    });
  });

  describe('shouldSynchronizeSchema', () => {
    it('syncs in development', () => {
      expect(shouldSynchronizeSchema('development', false)).toBe(true);
    });

    it('does not sync in production by default', () => {
      expect(shouldSynchronizeSchema('production', false)).toBe(false);
    });

    it('syncs in production when SYNC_SCHEMA=true', () => {
      expect(shouldSynchronizeSchema('production', true)).toBe(true);
    });
  });
});
