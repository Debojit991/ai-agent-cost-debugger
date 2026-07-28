import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'ai-agent-cost-debugger',
    env: process.env.NODE_ENV || 'development',
  },
});

/**
 * Creates a child logger with bound traceId for end-to-end request tracing.
 * @param traceId The unique request/pipeline execution UUID
 */
export const getTraceLogger = (traceId: string) => {
  return logger.child({ traceId });
};
