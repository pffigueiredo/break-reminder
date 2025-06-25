
import { db } from '../db';
import { breakReminderConfigsTable } from '../db/schema';
import { type GetUserConfigInput, type BreakReminderConfig } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserConfig = async (input: GetUserConfigInput): Promise<BreakReminderConfig | null> => {
  try {
    // Query for user's break reminder configuration
    const results = await db.select()
      .from(breakReminderConfigsTable)
      .where(eq(breakReminderConfigsTable.user_id, input.user_id))
      .limit(1)
      .execute();

    // Return null if no configuration found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) configuration
    return results[0];
  } catch (error) {
    console.error('Failed to get user config:', error);
    throw error;
  }
};
