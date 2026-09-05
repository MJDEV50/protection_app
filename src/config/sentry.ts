import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger';

export function initializeSentry() {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    attachStacktrace: true,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });

  logger.info('✓ Sentry initialized');
}

export { Sentry };
