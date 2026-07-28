import { StepResult } from '../types/agent.types';
import { getTraceLogger } from '../logging/logger';

export async function runSummarizerStep(query: string, traceId: string, uncompressedContext: string, researchOutput: string): Promise<StepResult> {
  const log = getTraceLogger(traceId);
  const startTime = Date.now();
  const stepName = 'Summarizer';

  log.info({ stepName, researchOutputLength: researchOutput.length, contextLength: uncompressedContext.length }, `[${stepName}] Starting execution...`);

  // Simulate heavy processing latency (e.g., 900ms)
  await new Promise((resolve) => setTimeout(resolve, 900));

  const latencyMs = Date.now() - startTime;
  // Naively consumes ~25,000 input tokens by re-ingesting total uncompressed context
  const tokensConsumed = 25000;
  const outputContext = `Summary generated: Key insights synthesized from research (${researchOutput.slice(0, 50)}...).`;

  log.info({ stepName, latencyMs, tokensConsumed }, `[${stepName}] Execution completed.`);

  return {
    stepName,
    latencyMs,
    tokensConsumed,
    outputContext,
  };
}
