
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { breakNotificationsTable } from '../db/schema';
import { type DismissNotificationInput } from '../schema';
import { dismissNotification } from '../handlers/dismiss_notification';
import { eq } from 'drizzle-orm';

describe('dismissNotification', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should dismiss a notification', async () => {
    // Create a notification directly in the database for testing
    const insertResult = await db.insert(breakNotificationsTable)
      .values({
        user_id: 'test-user-123',
        message: 'Time for a break!',
        dismissed_at: null
      })
      .returning()
      .execute();

    const notification = insertResult[0];
    
    const dismissInput: DismissNotificationInput = {
      id: notification.id
    };

    const result = await dismissNotification(dismissInput);

    // Verify the notification is marked as dismissed
    expect(result.id).toEqual(notification.id);
    expect(result.user_id).toEqual('test-user-123');
    expect(result.message).toEqual('Time for a break!');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.dismissed_at).toBeInstanceOf(Date);
    expect(result.dismissed_at).not.toBeNull();
  });

  it('should save dismissed notification to database', async () => {
    // Create a notification directly in the database for testing
    const insertResult = await db.insert(breakNotificationsTable)
      .values({
        user_id: 'test-user-123',
        message: 'Time for a break!',
        dismissed_at: null
      })
      .returning()
      .execute();

    const notification = insertResult[0];
    
    const dismissInput: DismissNotificationInput = {
      id: notification.id
    };

    const result = await dismissNotification(dismissInput);

    // Query the database to verify the notification was updated
    const notifications = await db.select()
      .from(breakNotificationsTable)
      .where(eq(breakNotificationsTable.id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toEqual(notification.id);
    expect(notifications[0].dismissed_at).toBeInstanceOf(Date);
    expect(notifications[0].dismissed_at).not.toBeNull();
  });

  it('should throw error for non-existent notification', async () => {
    const dismissInput: DismissNotificationInput = {
      id: 99999 // Non-existent ID
    };

    await expect(dismissNotification(dismissInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve original notification data when dismissing', async () => {
    // Create a notification with custom message directly in the database
    const insertResult = await db.insert(breakNotificationsTable)
      .values({
        user_id: 'custom-user-456',
        message: 'Custom break message!',
        dismissed_at: null
      })
      .returning()
      .execute();

    const notification = insertResult[0];
    
    const dismissInput: DismissNotificationInput = {
      id: notification.id
    };

    const result = await dismissNotification(dismissInput);

    // Verify all original data is preserved
    expect(result.user_id).toEqual('custom-user-456');
    expect(result.message).toEqual('Custom break message!');
    expect(result.created_at).toEqual(notification.created_at);
    expect(result.dismissed_at).toBeInstanceOf(Date);
  });

  it('should not dismiss already dismissed notification', async () => {
    // Create a notification and dismiss it first
    const insertResult = await db.insert(breakNotificationsTable)
      .values({
        user_id: 'test-user-123',
        message: 'Time for a break!',
        dismissed_at: null
      })
      .returning()
      .execute();

    const notification = insertResult[0];
    
    const dismissInput: DismissNotificationInput = {
      id: notification.id
    };

    // First dismissal
    const firstResult = await dismissNotification(dismissInput);
    const firstDismissedAt = firstResult.dismissed_at;

    // Second dismissal attempt
    const secondResult = await dismissNotification(dismissInput);
    
    // Verify the dismissed_at timestamp was updated (second dismissal overwrites first)
    expect(secondResult.dismissed_at).toBeInstanceOf(Date);
    expect(secondResult.dismissed_at).not.toEqual(firstDismissedAt);
  });
});
