
import { db } from '../db';
import { breakReminderConfigsTable } from '../db/schema';
import { type UpdateBreakReminderConfigInput, type BreakReminderConfig } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBreakReminderConfig = async (input: UpdateBreakReminderConfigInput): Promise<BreakReminderConfig> => {
  try {
    // Build update values object with only provided fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.interval_minutes !== undefined) {
      updateValues.interval_minutes = input.interval_minutes;
    }

    if (input.is_active !== undefined) {
      updateValues.is_active = input.is_active;
    }

    // Update the record and return the updated data
    const result = await db.update(breakReminderConfigsTable)
      .set(updateValues)
      .where(eq(breakReminderConfigsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Break reminder config with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Break reminder config update failed:', error);
    throw error;
  }
};
