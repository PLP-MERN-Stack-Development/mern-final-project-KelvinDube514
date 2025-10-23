const winston = require('winston');
const path = require('path');
// Make Sentry optional to avoid test/runtime failures when the package is unavailable
let Sentry;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  Sentry = require('@sentry/node');
} catch (err) {
  Sentry = null;
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'securepath-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Optional Sentry initialization (no-op without DSN)
if (Sentry && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  });

  // Capture unhandled exceptions via process listeners
  process.on('uncaughtException', (err) => {
    Sentry.captureException(err);
  });
  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  });
}

module.exports = logger;
