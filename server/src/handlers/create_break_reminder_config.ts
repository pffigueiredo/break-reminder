
import { db } from '../db';
import { breakReminderConfigsTable } from '../db/schema';
import { type CreateBreakReminderConfigInput, type BreakReminderConfig } from '../schema';

export const createBreakReminderConfig = async (input: CreateBreakReminderConfigInput): Promise<BreakReminderConfig> => {
  try {
    // Insert break reminder config record
    const result = await db.insert(breakReminderConfigsTable)
      .values({
        user_id: input.user_id,
        interval_minutes: input.interval_minutes, // Already has default from Zod schema
        is_active: input.is_active // Already has default from Zod schema
      })
      .returning()
      .execute();

    // Return the created config
    const config = result[0];
    return config;
  } catch (error) {
    console.error('Break reminder config creation failed:', error);
    throw error;
  }
};
