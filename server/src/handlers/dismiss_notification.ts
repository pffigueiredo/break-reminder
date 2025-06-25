
import { db } from '../db';
import { breakNotificationsTable } from '../db/schema';
import { type DismissNotificationInput, type BreakNotification } from '../schema';
import { eq } from 'drizzle-orm';

export const dismissNotification = async (input: DismissNotificationInput): Promise<BreakNotification> => {
  try {
    // Update the notification to set dismissed_at to current timestamp
    const result = await db.update(breakNotificationsTable)
      .set({
        dismissed_at: new Date()
      })
      .where(eq(breakNotificationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Notification with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Notification dismissal failed:', error);
    throw error;
  }
};
