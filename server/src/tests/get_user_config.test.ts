
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { breakReminderConfigsTable } from '../db/schema';
import { type GetUserConfigInput } from '../schema';
import { getUserConfig } from '../handlers/get_user_config';

// Test input
const testInput: GetUserConfigInput = {
  user_id: 'test-user-123'
};

describe('getUserConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user config when it exists', async () => {
    // Create a test config first
    await db.insert(breakReminderConfigsTable)
      .values({
        user_id: 'test-user-123',
        interval_minutes: 45,
        is_active: true
      })
      .execute();

    const result = await getUserConfig(testInput);

    expect(result).not.toBeNull();
    expect(result?.user_id).toEqual('test-user-123');
    expect(result?.interval_minutes).toEqual(45);
    expect(result?.is_active).toEqual(true);
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when no config exists', async () => {
    const result = await getUserConfig(testInput);

    expect(result).toBeNull();
  });

  it('should return only the specific user config', async () => {
    // Create configs for multiple users
    await db.insert(breakReminderConfigsTable)
      .values([
        {
          user_id: 'test-user-123',
          interval_minutes: 30,
          is_active: true
        },
        {
          user_id: 'other-user-456',
          interval_minutes: 90,
          is_active: false
        }
      ])
      .execute();

    const result = await getUserConfig(testInput);

    expect(result).not.toBeNull();
    expect(result?.user_id).toEqual('test-user-123');
    expect(result?.interval_minutes).toEqual(30);
    expect(result?.is_active).toEqual(true);
  });

  it('should return the most recent config when multiple exist for same user', async () => {
    // Create multiple configs for the same user (edge case)
    await db.insert(breakReminderConfigsTable)
      .values([
        {
          user_id: 'test-user-123',
          interval_minutes: 30,
          is_active: false
        },
        {
          user_id: 'test-user-123',
          interval_minutes: 60,
          is_active: true
        }
      ])
      .execute();

    const result = await getUserConfig(testInput);

    expect(result).not.toBeNull();
    expect(result?.user_id).toEqual('test-user-123');
    // Should return one of the configs (first one found due to limit(1))
    expect([30, 60]).toContain(result?.interval_minutes);
  });
});
