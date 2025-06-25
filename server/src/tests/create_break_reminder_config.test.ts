
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { breakReminderConfigsTable } from '../db/schema';
import { type CreateBreakReminderConfigInput, createBreakReminderConfigInputSchema } from '../schema';
import { createBreakReminderConfig } from '../handlers/create_break_reminder_config';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateBreakReminderConfigInput = {
  user_id: 'user123',
  interval_minutes: 30,
  is_active: true
};

describe('createBreakReminderConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a break reminder config', async () => {
    const result = await createBreakReminderConfig(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user123');
    expect(result.interval_minutes).toEqual(30);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save config to database', async () => {
    const result = await createBreakReminderConfig(testInput);

    // Query using proper drizzle syntax
    const configs = await db.select()
      .from(breakReminderConfigsTable)
      .where(eq(breakReminderConfigsTable.id, result.id))
      .execute();

    expect(configs).toHaveLength(1);
    expect(configs[0].user_id).toEqual('user123');
    expect(configs[0].interval_minutes).toEqual(30);
    expect(configs[0].is_active).toEqual(true);
    expect(configs[0].created_at).toBeInstanceOf(Date);
    expect(configs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should use default values when not provided', async () => {
    // Parse the minimal input to get defaults applied
    const parsedInput = createBreakReminderConfigInputSchema.parse({
      user_id: 'user456'
      // interval_minutes and is_active will use Zod defaults
    });

    const result = await createBreakReminderConfig(parsedInput);

    expect(result.user_id).toEqual('user456');
    expect(result.interval_minutes).toEqual(60); // Default from Zod schema
    expect(result.is_active).toEqual(true); // Default from Zod schema
  });

  it('should allow multiple configs for different users', async () => {
    const user1Input: CreateBreakReminderConfigInput = {
      user_id: 'user1',
      interval_minutes: 15,
      is_active: true
    };

    const user2Input: CreateBreakReminderConfigInput = {
      user_id: 'user2',
      interval_minutes: 45,
      is_active: false
    };

    const result1 = await createBreakReminderConfig(user1Input);
    const result2 = await createBreakReminderConfig(user2Input);

    expect(result1.user_id).toEqual('user1');
    expect(result1.interval_minutes).toEqual(15);
    expect(result1.is_active).toEqual(true);

    expect(result2.user_id).toEqual('user2');
    expect(result2.interval_minutes).toEqual(45);
    expect(result2.is_active).toEqual(false);

    // Verify both exist in database
    const allConfigs = await db.select()
      .from(breakReminderConfigsTable)
      .execute();

    expect(allConfigs).toHaveLength(2);
  });
});
