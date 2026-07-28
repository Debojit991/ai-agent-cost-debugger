import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { traceMiddleware } from './logging/trace_middleware';
import { logger } from './logging/logger';
import { runBaselinePipeline } from './agents/baseline_pipeline';
import { runOptimizedPipeline } from './agents/optimized_pipeline';
import { runFlakyPipeline } from './agents/flaky_pipeline';
import { traceStore } from './logging/trace_store';
import { PipelineRequest } from './types/agent.types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(traceMiddleware);

// Health Check Endpoint
app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-agent-cost-debugger-backend',
    traceId: req.traceId,
    timestamp: new Date().toISOString(),
  });
});

// Baseline Heavy Pipeline Endpoint
app.post('/api/pipeline/baseline', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const userQuery = query && typeof query === 'string' && query.trim() !== ''
      ? query
      : 'Analyze system architecture for cost optimization bottlenecks';

    const pipelineReq: PipelineRequest = {
      query: userQuery,
      traceId: req.traceId,
    };

    req.logger.info({ query: userQuery }, 'Triggering baseline heavy execution pipeline');

    const result = await runBaselinePipeline(pipelineReq);

    res.status(200).json(result);
  } catch (error) {
    req.logger.error({ error }, 'Error executing baseline pipeline');
    res.status(500).json({
      error: 'Failed to execute baseline pipeline',
      traceId: req.traceId,
    });
  }
});

// Optimized Context-Pruned Pipeline Endpoint
app.post('/api/pipeline/optimized', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const userQuery = query && typeof query === 'string' && query.trim() !== ''
      ? query
      : 'Analyze system architecture for cost optimization bottlenecks';

    const pipelineReq: PipelineRequest = {
      query: userQuery,
      traceId: req.traceId,
    };

    req.logger.info({ query: userQuery }, 'Triggering optimized context-pruned execution pipeline');

    const result = await runOptimizedPipeline(pipelineReq);

    res.status(200).json(result);
  } catch (error) {
    req.logger.error({ error }, 'Error executing optimized pipeline');
    res.status(500).json({
      error: 'Failed to execute optimized pipeline',
      traceId: req.traceId,
    });
  }
});

// Flaky Resiliency Pipeline Endpoint
app.post('/api/pipeline/flaky', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const userQuery = query && typeof query === 'string' && query.trim() !== ''
      ? query
      : 'Test pipeline resiliency against intermittent timeouts and schema errors';

    const pipelineReq: PipelineRequest = {
      query: userQuery,
      traceId: req.traceId,
    };

    req.logger.info({ query: userQuery }, 'Triggering flaky resiliency simulation pipeline');

    const result = await runFlakyPipeline(pipelineReq);

    res.status(200).json(result);
  } catch (error: any) {
    req.logger.error({ error: error.message }, 'Flaky pipeline failed despite retries');
    res.status(500).json({
      error: 'Flaky pipeline unrecoverable failure',
      message: error.message,
      traceId: req.traceId,
    });
  }
});

// Trace Telemetry Inspection Endpoint
app.get('/api/trace/:traceId', (req: Request, res: Response) => {
  const { traceId } = req.params;
  const telemetry = traceStore.get(traceId);

  if (!telemetry) {
    res.status(404).json({
      error: 'Trace ID not found in active memory log store',
      traceId,
    });
    return;
  }

  res.status(200).json(telemetry);
});

// Start Express Server
app.listen(PORT, () => {
  logger.info(`AI Agent Cost Debugger Server listening on port ${PORT}`);
});

export default app;
