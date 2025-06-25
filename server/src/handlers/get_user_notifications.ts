
import { db } from '../db';
import { breakNotificationsTable } from '../db/schema';
import { type GetUserNotificationsInput, type BreakNotification } from '../schema';
import { eq, isNull, and, desc } from 'drizzle-orm';

export const getUserNotifications = async (input: GetUserNotificationsInput): Promise<BreakNotification[]> => {
  try {
    // Build conditions array
    const conditions = [eq(breakNotificationsTable.user_id, input.user_id)];

    // If include_dismissed is false, only get non-dismissed notifications
    if (!input.include_dismissed) {
      conditions.push(isNull(breakNotificationsTable.dismissed_at));
    }

    // Build and execute query in one go
    const results = await db.select()
      .from(breakNotificationsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(breakNotificationsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user notifications:', error);
    throw error;
  }
};
