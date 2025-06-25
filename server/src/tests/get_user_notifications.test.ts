
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { breakNotificationsTable } from '../db/schema';
import { type GetUserNotificationsInput } from '../schema';
import { getUserNotifications } from '../handlers/get_user_notifications';

const testInput: GetUserNotificationsInput = {
  user_id: 'test-user-123',
  include_dismissed: false
};

describe('getUserNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no notifications', async () => {
    const result = await getUserNotifications(testInput);

    expect(result).toEqual([]);
  });

  it('should return only non-dismissed notifications when include_dismissed is false', async () => {
    // Create test notifications - one dismissed, one not
    await db.insert(breakNotificationsTable)
      .values([
        {
          user_id: 'test-user-123',
          message: 'Active notification',
          dismissed_at: null
        },
        {
          user_id: 'test-user-123',
          message: 'Dismissed notification',
          dismissed_at: new Date()
        }
      ])
      .execute();

    const result = await getUserNotifications({
      user_id: 'test-user-123',
      include_dismissed: false
    });

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual('Active notification');
    expect(result[0].dismissed_at).toBeNull();
  });

  it('should return all notifications when include_dismissed is true', async () => {
    // Create test notifications - one dismissed, one not
    await db.insert(breakNotificationsTable)
      .values([
        {
          user_id: 'test-user-123',
          message: 'Active notification',
          dismissed_at: null
        },
        {
          user_id: 'test-user-123',
          message: 'Dismissed notification',
          dismissed_at: new Date()
        }
      ])
      .execute();

    const result = await getUserNotifications({
      user_id: 'test-user-123',
      include_dismissed: true
    });

    expect(result).toHaveLength(2);
    
    // Check that we have both notifications
    const messages = result.map(n => n.message).sort();
    expect(messages).toEqual(['Active notification', 'Dismissed notification']);
  });

  it('should only return notifications for the specified user', async () => {
    // Create notifications for different users
    await db.insert(breakNotificationsTable)
      .values([
        {
          user_id: 'test-user-123',
          message: 'User 123 notification'
        },
        {
          user_id: 'other-user-456',
          message: 'Other user notification'
        }
      ])
      .execute();

    const result = await getUserNotifications({
      user_id: 'test-user-123',
      include_dismissed: true
    });

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual('User 123 notification');
    expect(result[0].user_id).toEqual('test-user-123');
  });

  it('should return notifications with correct data structure', async () => {
    await db.insert(breakNotificationsTable)
      .values({
        user_id: 'test-user-123',
        message: 'Test notification'
      })
      .execute();

    const result = await getUserNotifications(testInput);

    expect(result).toHaveLength(1);
    const notification = result[0];
    
    expect(notification.id).toBeDefined();
    expect(notification.user_id).toEqual('test-user-123');
    expect(notification.message).toEqual('Test notification');
    expect(notification.created_at).toBeInstanceOf(Date);
    expect(notification.dismissed_at).toBeNull();
  });

  it('should return notifications ordered by created_at descending', async () => {
    // Create notifications with slight delay to ensure different timestamps
    await db.insert(breakNotificationsTable)
      .values({
        user_id: 'test-user-123',
        message: 'First notification'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(breakNotificationsTable)
      .values({
        user_id: 'test-user-123',
        message: 'Second notification'
      })
      .execute();

    const result = await getUserNotifications({
      user_id: 'test-user-123',
      include_dismissed: true
    });

    expect(result).toHaveLength(2);
    // Newest should be first (descending order)
    expect(result[0].message).toEqual('Second notification');
    expect(result[1].message).toEqual('First notification');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });
});
