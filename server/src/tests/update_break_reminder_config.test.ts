
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { breakReminderConfigsTable } from '../db/schema';
import { type CreateBreakReminderConfigInput, type UpdateBreakReminderConfigInput } from '../schema';
import { updateBreakReminderConfig } from '../handlers/update_break_reminder_config';
import { eq } from 'drizzle-orm';

// Helper to create a test config
const createTestConfig = async (): Promise<number> => {
  const testInput: CreateBreakReminderConfigInput = {
    user_id: 'test-user',
    interval_minutes: 30,
    is_active: true
  };

  const result = await db.insert(breakReminderConfigsTable)
    .values(testInput)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateBreakReminderConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update interval_minutes only', async () => {
    const configId = await createTestConfig();
    
    const updateInput: UpdateBreakReminderConfigInput = {
      id: configId,
      interval_minutes: 90
    };

    const result = await updateBreakReminderConfig(updateInput);

    expect(result.id).toEqual(configId);
    expect(result.interval_minutes).toEqual(90);
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.user_id).toEqual('test-user');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update is_active only', async () => {
    const configId = await createTestConfig();
    
    const updateInput: UpdateBreakReminderConfigInput = {
      id: configId,
      is_active: false
    };

    const result = await updateBreakReminderConfig(updateInput);

    expect(result.id).toEqual(configId);
    expect(result.is_active).toEqual(false);
    expect(result.interval_minutes).toEqual(30); // Should remain unchanged
    expect(result.user_id).toEqual('test-user');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both fields', async () => {
    const configId = await createTestConfig();
    
    const updateInput: UpdateBreakReminderConfigInput = {
      id: configId,
      interval_minutes: 120,
      is_active: false
    };

    const result = await updateBreakReminderConfig(updateInput);

    expect(result.id).toEqual(configId);
    expect(result.interval_minutes).toEqual(120);
    expect(result.is_active).toEqual(false);
    expect(result.user_id).toEqual('test-user');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the record in database', async () => {
    const configId = await createTestConfig();
    
    const updateInput: UpdateBreakReminderConfigInput = {
      id: configId,
      interval_minutes: 45,
      is_active: false
    };

    await updateBreakReminderConfig(updateInput);

    // Verify changes in database
    const configs = await db.select()
      .from(breakReminderConfigsTable)
      .where(eq(breakReminderConfigsTable.id, configId))
      .execute();

    expect(configs).toHaveLength(1);
    expect(configs[0].interval_minutes).toEqual(45);
    expect(configs[0].is_active).toEqual(false);
    expect(configs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const configId = await createTestConfig();
    
    // Get original timestamp
    const originalConfig = await db.select()
      .from(breakReminderConfigsTable)
      .where(eq(breakReminderConfigsTable.id, configId))
      .execute();

    const originalUpdatedAt = originalConfig[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateBreakReminderConfigInput = {
      id: configId,
      interval_minutes: 75
    };

    const result = await updateBreakReminderConfig(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent config', async () => {
    const updateInput: UpdateBreakReminderConfigInput = {
      id: 999999,
      interval_minutes: 60
    };

    await expect(updateBreakReminderConfig(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve created_at timestamp', async () => {
    const configId = await createTestConfig();
    
    // Get original timestamps
    const originalConfig = await db.select()
      .from(breakReminderConfigsTable)
      .where(eq(breakReminderConfigsTable.id, configId))
      .execute();

    const originalCreatedAt = originalConfig[0].created_at;

    const updateInput: UpdateBreakReminderConfigInput = {
      id: configId,
      is_active: false
    };

    const result = await updateBreakReminderConfig(updateInput);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
  });
});
