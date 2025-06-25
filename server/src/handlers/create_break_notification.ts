
import { db } from '../db';
import { breakNotificationsTable } from '../db/schema';
import { type CreateBreakNotificationInput, type BreakNotification } from '../schema';

export const createBreakNotification = async (input: CreateBreakNotificationInput): Promise<BreakNotification> => {
  try {
    // Insert notification record
    const result = await db.insert(breakNotificationsTable)
      .values({
        user_id: input.user_id,
        message: input.message // Zod default is already applied
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Break notification creation failed:', error);
    throw error;
  }
};
