
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { breakNotificationsTable } from '../db/schema';
import { type CreateBreakNotificationInput } from '../schema';
import { createBreakNotification } from '../handlers/create_break_notification';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateBreakNotificationInput = {
  user_id: 'test-user-123',
  message: 'Time for a stretching break!'
};

// Minimal test input relying on Zod defaults - cast to match the expected type
const minimalInput = {
  user_id: 'minimal-user-456'
} as CreateBreakNotificationInput;

describe('createBreakNotification', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a break notification with custom message', async () => {
    const result = await createBreakNotification(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-123');
    expect(result.message).toEqual('Time for a stretching break!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.dismissed_at).toBeNull();
  });

  it('should create a break notification with default message', async () => {
    const result = await createBreakNotification(minimalInput);

    // Verify default message is applied
    expect(result.user_id).toEqual('minimal-user-456');
    expect(result.message).toEqual('Time for a break!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.dismissed_at).toBeNull();
  });

  it('should save notification to database', async () => {
    const result = await createBreakNotification(testInput);

    // Query using proper drizzle syntax
    const notifications = await db.select()
      .from(breakNotificationsTable)
      .where(eq(breakNotificationsTable.id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].user_id).toEqual('test-user-123');
    expect(notifications[0].message).toEqual('Time for a stretching break!');
    expect(notifications[0].created_at).toBeInstanceOf(Date);
    expect(notifications[0].dismissed_at).toBeNull();
  });

  it('should handle multiple notifications for same user', async () => {
    // Create multiple notifications for the same user
    const notification1 = await createBreakNotification({
      user_id: 'multi-user-789',
      message: 'First break reminder'
    });

    const notification2 = await createBreakNotification({
      user_id: 'multi-user-789',
      message: 'Second break reminder'
    });

    // Both should have different IDs
    expect(notification1.id).not.toEqual(notification2.id);
    expect(notification1.user_id).toEqual(notification2.user_id);
    expect(notification1.message).toEqual('First break reminder');
    expect(notification2.message).toEqual('Second break reminder');

    // Verify both are saved in database
    const userNotifications = await db.select()
      .from(breakNotificationsTable)
      .where(eq(breakNotificationsTable.user_id, 'multi-user-789'))
      .execute();

    expect(userNotifications).toHaveLength(2);
  });
});
