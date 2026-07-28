import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getTraceLogger } from './logger';
import pino from 'pino';

// Extend Express Request type to include traceId and traceLogger
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      logger: pino.Logger;
    }
  }
}

/**
 * Express middleware to ensure every HTTP request has a trace ID for structured logging.
 * Extracts X-Trace-Id from header if supplied, otherwise generates a new UUID v4.
 */
export const traceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingTraceId = req.header('x-trace-id');
  const traceId = incomingTraceId && incomingTraceId.trim() !== '' ? incomingTraceId : uuidv4();

  req.traceId = traceId;
  req.logger = getTraceLogger(traceId);

  res.setHeader('X-Trace-Id', traceId);

  req.logger.info(
    {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    },
    `Incoming Request: ${req.method} ${req.originalUrl}`
  );

  next();
};
