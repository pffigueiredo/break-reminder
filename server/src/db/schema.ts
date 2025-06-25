
import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const breakReminderConfigsTable = pgTable('break_reminder_configs', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  interval_minutes: integer('interval_minutes').notNull().default(60),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const breakNotificationsTable = pgTable('break_notifications', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  message: text('message').notNull().default('Time for a break!'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  dismissed_at: timestamp('dismissed_at'), // Nullable - null means not dismissed
});

// Define relations between tables
export const breakReminderConfigsRelations = relations(breakReminderConfigsTable, ({ many }) => ({
  notifications: many(breakNotificationsTable),
}));

export const breakNotificationsRelations = relations(breakNotificationsTable, ({ one }) => ({
  config: one(breakReminderConfigsTable, {
    fields: [breakNotificationsTable.user_id],
    references: [breakReminderConfigsTable.user_id],
  }),
}));

// TypeScript types for the table schemas
export type BreakReminderConfig = typeof breakReminderConfigsTable.$inferSelect;
export type NewBreakReminderConfig = typeof breakReminderConfigsTable.$inferInsert;
export type BreakNotification = typeof breakNotificationsTable.$inferSelect;
export type NewBreakNotification = typeof breakNotificationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  breakReminderConfigs: breakReminderConfigsTable,
  breakNotifications: breakNotificationsTable
};
