
import { z } from 'zod';

// Break reminder configuration schema
export const breakReminderConfigSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Simple user identification
  interval_minutes: z.number().int().min(1).max(1440), // 1 minute to 24 hours
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BreakReminderConfig = z.infer<typeof breakReminderConfigSchema>;

// Input schema for creating break reminder config
export const createBreakReminderConfigInputSchema = z.object({
  user_id: z.string().min(1),
  interval_minutes: z.number().int().min(1).max(1440).default(60), // Default 60 minutes
  is_active: z.boolean().default(true)
});

export type CreateBreakReminderConfigInput = z.infer<typeof createBreakReminderConfigInputSchema>;

// Input schema for updating break reminder config
export const updateBreakReminderConfigInputSchema = z.object({
  id: z.number(),
  interval_minutes: z.number().int().min(1).max(1440).optional(),
  is_active: z.boolean().optional()
});

export type UpdateBreakReminderConfigInput = z.infer<typeof updateBreakReminderConfigInputSchema>;

// Break notification schema
export const breakNotificationSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  message: z.string(),
  created_at: z.coerce.date(),
  dismissed_at: z.coerce.date().nullable()
});

export type BreakNotification = z.infer<typeof breakNotificationSchema>;

// Input schema for creating break notification
export const createBreakNotificationInputSchema = z.object({
  user_id: z.string().min(1),
  message: z.string().default('Time for a break!')
});

export type CreateBreakNotificationInput = z.infer<typeof createBreakNotificationInputSchema>;

// Input schema for dismissing notification
export const dismissNotificationInputSchema = z.object({
  id: z.number()
});

export type DismissNotificationInput = z.infer<typeof dismissNotificationInputSchema>;

// Query schema for getting user's config
export const getUserConfigInputSchema = z.object({
  user_id: z.string().min(1)
});

export type GetUserConfigInput = z.infer<typeof getUserConfigInputSchema>;

// Query schema for getting user's notifications
export const getUserNotificationsInputSchema = z.object({
  user_id: z.string().min(1),
  include_dismissed: z.boolean().default(false)
});

export type GetUserNotificationsInput = z.infer<typeof getUserNotificationsInputSchema>;
