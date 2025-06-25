
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createBreakReminderConfigInputSchema,
  updateBreakReminderConfigInputSchema,
  getUserConfigInputSchema,
  createBreakNotificationInputSchema,
  dismissNotificationInputSchema,
  getUserNotificationsInputSchema
} from './schema';

// Import handlers
import { createBreakReminderConfig } from './handlers/create_break_reminder_config';
import { updateBreakReminderConfig } from './handlers/update_break_reminder_config';
import { getUserConfig } from './handlers/get_user_config';
import { createBreakNotification } from './handlers/create_break_notification';
import { dismissNotification } from './handlers/dismiss_notification';
import { getUserNotifications } from './handlers/get_user_notifications';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Break reminder configuration endpoints
  createBreakReminderConfig: publicProcedure
    .input(createBreakReminderConfigInputSchema)
    .mutation(({ input }) => createBreakReminderConfig(input)),
    
  updateBreakReminderConfig: publicProcedure
    .input(updateBreakReminderConfigInputSchema)
    .mutation(({ input }) => updateBreakReminderConfig(input)),
    
  getUserConfig: publicProcedure
    .input(getUserConfigInputSchema)
    .query(({ input }) => getUserConfig(input)),
    
  // Break notification endpoints
  createBreakNotification: publicProcedure
    .input(createBreakNotificationInputSchema)
    .mutation(({ input }) => createBreakNotification(input)),
    
  dismissNotification: publicProcedure
    .input(dismissNotificationInputSchema)
    .mutation(({ input }) => dismissNotification(input)),
    
  getUserNotifications: publicProcedure
    .input(getUserNotificationsInputSchema)
    .query(({ input }) => getUserNotifications(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Break Reminder TRPC server listening at port: ${port}`);
}

start();
