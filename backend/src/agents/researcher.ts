import { StepResult } from '../types/agent.types';
import { getTraceLogger } from '../logging/logger';

export async function runResearcherStep(query: string, traceId: string, uncompressedContext: string, planOutput: string): Promise<StepResult> {
  const log = getTraceLogger(traceId);
  const startTime = Date.now();
  const stepName = 'Researcher';

  log.info({ stepName, planOutputLength: planOutput.length, contextLength: uncompressedContext.length }, `[${stepName}] Starting execution...`);

  // Simulate heavy processing latency (e.g., 1200ms)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const latencyMs = Date.now() - startTime;
  // Naively consumes ~25,000 input tokens by passing uncompressed document context again
  const tokensConsumed = 25000;
  const outputContext = `Research completed based on plan "${planOutput}". Found 47 relevant references across uncompressed context.`;

  log.info({ stepName, latencyMs, tokensConsumed }, `[${stepName}] Execution completed.`);

  return {
    stepName,
    latencyMs,
    tokensConsumed,
    outputContext,
  };
}
