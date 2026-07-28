import { StepResult } from '../types/agent.types';
import { getTraceLogger } from '../logging/logger';

export async function runFormatterStep(query: string, traceId: string, uncompressedContext: string, summaryOutput: string): Promise<StepResult> {
  const log = getTraceLogger(traceId);
  const startTime = Date.now();
  const stepName = 'Formatter';

  log.info({ stepName, summaryOutputLength: summaryOutput.length, contextLength: uncompressedContext.length }, `[${stepName}] Starting execution...`);

  // Simulate heavy processing latency (e.g., 900ms)
  await new Promise((resolve) => setTimeout(resolve, 900));

  const latencyMs = Date.now() - startTime;
  // Naively consumes ~25,000 input tokens by passing full uncompressed document context once more
  const tokensConsumed = 25000;
  const outputContext = `Final formatted response for query "${query}": Based on extensive context analysis, the AI system pipeline execution completed successfully. Summary: ${summaryOutput}`;

  log.info({ stepName, latencyMs, tokensConsumed }, `[${stepName}] Execution completed.`);

  return {
    stepName,
    latencyMs,
    tokensConsumed,
    outputContext,
  };
}
