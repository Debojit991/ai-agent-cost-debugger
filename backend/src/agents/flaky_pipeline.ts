import { PipelineRequest, PipelineResult, StepResult } from '../types/agent.types';
import { getTraceLogger } from '../logging/logger';
import {
  PlannerOutputSchema,
  ResearcherOutputSchema,
  SummarizerOutputSchema,
  FormatterOutputSchema,
  validateAndCorrect,
} from './validator';
import { callGeminiStep } from '../optimization/gemini_client';
import { routeModel } from '../optimization/router';
import { traceStore, StepTraceLog, PipelineTraceTelemetry } from '../logging/trace_store';
import { ZodSchema } from 'zod';

export { StepTraceLog, PipelineTraceTelemetry, traceStore };

/**
 * Exponential Backoff Retry Wrapper with Schema Validation for Live Gemini Calls
 */
async function executeStepWithRetry<T>(
  stepName: string,
  traceId: string,
  stepFn: (attempt: number) => Promise<any>,
  schema: ZodSchema<T>,
  stepLogs: StepTraceLog[],
  maxRetries = 2
): Promise<{ stepResult: StepResult; validatedData: T }> {
  const log = getTraceLogger(traceId);
  let attempt = 0;
  let lastError = '';

  while (attempt <= maxRetries) {
    attempt++;
    const startTime = Date.now();
    log.info({ stepName, attempt, maxRetries }, `[FlakyPipeline] Executing ${stepName} (Attempt ${attempt}/${maxRetries + 1})`);

    try {
      const rawPayload = await stepFn(attempt);
      const latencyMs = Date.now() - startTime;

      const validation = validateAndCorrect(rawPayload, schema);

      if (!validation.success) {
        throw new Error(`Schema Validation Failure: ${validation.error}`);
      }

      log.info({ stepName, attempt, latencyMs }, `[FlakyPipeline] ${stepName} PASSED on attempt ${attempt}`);

      stepLogs.push({
        stepName,
        attempt,
        status: attempt === 1 ? 'PASSED' : 'RETRIED',
        latencyMs,
        payload: validation.data,
      });

      return {
        stepResult: {
          stepName,
          latencyMs,
          tokensConsumed: Math.ceil(JSON.stringify(rawPayload).length / 4),
          outputContext: JSON.stringify(validation.data),
        },
        validatedData: validation.data!,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      lastError = err.message || 'Unknown Step Failure';

      log.error(
        { stepName, attempt, latencyMs, error: lastError },
        `[FlakyPipeline] ${stepName} FAILED on attempt ${attempt}: ${lastError}`
      );

      stepLogs.push({
        stepName,
        attempt,
        status: 'FAILED',
        latencyMs,
        error: lastError,
      });

      if (attempt <= maxRetries) {
        const backoffMs = 300 * Math.pow(2, attempt - 1);
        log.warn({ stepName, backoffMs }, `[FlakyPipeline] Backing off for ${backoffMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(`Step ${stepName} failed after ${maxRetries + 1} attempts. Last Error: ${lastError}`);
}

/**
 * Flaky Pipeline Simulation
 */
export async function runFlakyPipeline(req: PipelineRequest): Promise<PipelineResult> {
  const { query, traceId } = req;
  const log = getTraceLogger(traceId);
  const overallStartTime = Date.now();
  const stepLogs: StepTraceLog[] = [];

  log.info({ query, traceId }, '=== Starting Flaky Resiliency Pipeline Execution ===');

  try {
    // Step 1: Planner
    const plannerRes = await executeStepWithRetry(
      'Planner',
      traceId,
      async () => {
        const route = routeModel('Planner');
        const prompt = `Create a plan for query: "${query}". Return JSON format.`;
        const res = await callGeminiStep(route.modelName, prompt, traceId);
        return {
          stepName: 'Planner',
          status: 'success',
          planSteps: ['Gather Resiliency Data', 'Validate Key Specs', 'Format Response'],
          estimatedTokens: res.inputTokens,
        };
      },
      PlannerOutputSchema,
      stepLogs
    );

    // Step 2: Researcher (30% chance of timeout on first attempt)
    const researcherRes = await executeStepWithRetry(
      'Researcher',
      traceId,
      async (attempt: number) => {
        if (attempt === 1 && Math.random() < 0.3) {
          log.warn({ traceId }, '[FlakySim] Simulating 5000ms network timeout in Researcher step');
          await new Promise((r) => setTimeout(r, 5000));
          throw new Error('5000ms Network Timeout: LLM upstream service unresponsive');
        }
        const route = routeModel('Researcher');
        const prompt = `Perform research for query: "${query}".`;
        const res = await callGeminiStep(route.modelName, prompt, traceId);
        return {
          stepName: 'Researcher',
          status: 'success',
          referencesCount: 12,
          researchData: `Research data generated via Gemini: ${res.text.slice(0, 100)}`,
        };
      },
      ResearcherOutputSchema,
      stepLogs
    );

    // Step 3: Summarizer (30% chance of returning malformed JSON missing keys)
    const summarizerRes = await executeStepWithRetry(
      'Summarizer',
      traceId,
      async (attempt: number) => {
        if (attempt === 1 && Math.random() < 0.3) {
          log.warn({ traceId }, '[FlakySim] Simulating malformed output (missing keyInsights) in Summarizer step');
          return {
            stepName: 'Summarizer',
            status: 'success',
            summaryText: 'Summary generated but missing mandatory keys.',
          };
        }
        const route = routeModel('Summarizer');
        const prompt = `Summarize research for query: "${query}".`;
        const res = await callGeminiStep(route.modelName, prompt, traceId);
        return {
          stepName: 'Summarizer',
          status: 'success',
          summaryText: res.text.slice(0, 100),
          keyInsights: ['Zero data loss', 'Retry backoff effective'],
        };
      },
      SummarizerOutputSchema,
      stepLogs
    );

    // Step 4: Formatter (20% chance of silent empty response)
    const formatterRes = await executeStepWithRetry(
      'Formatter',
      traceId,
      async (attempt: number) => {
        if (attempt === 1 && Math.random() < 0.2) {
          log.warn({ traceId }, '[FlakySim] Simulating silent empty response in Formatter step');
          return {
            stepName: 'Formatter',
            status: 'success',
            finalFormattedResponse: '',
          };
        }
        const route = routeModel('Formatter');
        const prompt = `Format final response for query: "${query}".`;
        const res = await callGeminiStep(route.modelName, prompt, traceId);
        return {
          stepName: 'Formatter',
          status: 'success',
          finalFormattedResponse: `Resiliency Pipeline Final Response for query "${query}": Workflow completed successfully. Details: ${res.text.slice(0, 150)}`,
        };
      },
      FormatterOutputSchema,
      stepLogs
    );

    const overallLatencyMs = Date.now() - overallStartTime;
    const result: PipelineResult = {
      traceId,
      response: formatterRes.validatedData.finalFormattedResponse,
      latencyMs: overallLatencyMs,
      metrics: {
        inputTokens: 40000,
        outputTokens: 500,
        estimatedCost: 0.09075,
      },
    };

    traceStore.set(traceId, {
      traceId,
      query,
      timestamp: new Date().toISOString(),
      overallLatencyMs,
      status: 'SUCCESS',
      stepLogs,
      metrics: result.metrics,
    });

    log.info({ traceId, overallLatencyMs }, '=== Flaky Pipeline Completed Successfully with Resiliency Retries ===');

    return result;
  } catch (err: any) {
    const overallLatencyMs = Date.now() - overallStartTime;
    traceStore.set(traceId, {
      traceId,
      query,
      timestamp: new Date().toISOString(),
      overallLatencyMs,
      status: 'FAILED',
      stepLogs,
      metrics: { inputTokens: 0, outputTokens: 0, estimatedCost: 0 },
    });

    log.error({ traceId, error: err.message }, '=== Flaky Pipeline Execution Unrecoverable Failure ===');
    throw err;
  }
}
