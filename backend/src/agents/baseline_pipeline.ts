import { PipelineRequest, PipelineResult, StepResult } from '../types/agent.types';
import { getTraceLogger } from '../logging/logger';
import { runPlannerStep } from './planner';
import { runResearcherStep } from './researcher';
import { runSummarizerStep } from './summarizer';
import { runFormatterStep } from './formatter';
import { traceStore, StepTraceLog } from '../logging/trace_store';

/**
 * Generates a mock 25,000-word uncompressed document context to represent un-pruned LLM context input.
 */
function generateUncompressedContext(): string {
  const baseText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. AI agent architecture requires token cost optimization. ";
  return baseText.repeat(2000); // approx 25,000 words
}

/**
 * Baseline Execution Pipeline
 * 
 * Simulates a highly inefficient 4-step sequential agent workflow (Planner -> Researcher -> Summarizer -> Formatter).
 * Naively re-passes a 25,000-word uncompressed document context to EVERY step, burning ~100,000 input tokens total.
 * Records step execution telemetry to global `traceStore`.
 * 
 * @param req PipelineRequest containing user query and unique traceId
 * @returns Promise<PipelineResult>
 */
export async function runBaselinePipeline(req: PipelineRequest): Promise<PipelineResult> {
  const { query, traceId } = req;
  const log = getTraceLogger(traceId);
  const overallStartTime = Date.now();

  log.info({ query, traceId }, '=== Starting Baseline Pipeline Execution ===');

  const uncompressedContext = generateUncompressedContext();
  const steps: StepResult[] = [];

  try {
    // Step 1: Planner
    const plannerResult = await runPlannerStep(query, traceId, uncompressedContext);
    steps.push(plannerResult);

    // Step 2: Researcher
    const researcherResult = await runResearcherStep(query, traceId, uncompressedContext, plannerResult.outputContext);
    steps.push(researcherResult);

    // Step 3: Summarizer
    const summarizerResult = await runSummarizerStep(query, traceId, uncompressedContext, researcherResult.outputContext);
    steps.push(summarizerResult);

    // Step 4: Formatter
    const formatterResult = await runFormatterStep(query, traceId, uncompressedContext, summarizerResult.outputContext);
    steps.push(formatterResult);

    const overallLatencyMs = Date.now() - overallStartTime;

    const totalInputTokens = steps.reduce((sum, s) => sum + s.tokensConsumed, 0);
    const totalOutputTokens = 850;
    const estimatedCost = (totalInputTokens / 1000) * 0.003;

    // Record Telemetry to Global traceStore
    const stepLogs: StepTraceLog[] = steps.map((s) => ({
      stepName: s.stepName,
      attempt: 1,
      status: 'PASSED',
      latencyMs: s.latencyMs,
      payload: {
        stepName: s.stepName,
        tokensConsumed: s.tokensConsumed,
        outputContext: s.outputContext,
      },
    }));

    traceStore.set(traceId, {
      traceId,
      query,
      timestamp: new Date().toISOString(),
      overallLatencyMs,
      status: 'SUCCESS',
      stepLogs,
      metrics: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        estimatedCost,
      },
    });

    log.info(
      {
        overallLatencyMs,
        totalInputTokens,
        totalOutputTokens,
        estimatedCost: `$${estimatedCost.toFixed(4)}`,
        stepCount: steps.length,
      },
      '=== Baseline Pipeline Execution Complete ==='
    );

    return {
      traceId,
      response: formatterResult.outputContext,
      latencyMs: overallLatencyMs,
      metrics: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        estimatedCost,
      },
    };
  } catch (err: any) {
    const overallLatencyMs = Date.now() - overallStartTime;
    const stepLogs: StepTraceLog[] = steps.map((s) => ({
      stepName: s.stepName,
      attempt: 1,
      status: 'PASSED',
      latencyMs: s.latencyMs,
      payload: { stepName: s.stepName, outputContext: s.outputContext },
    }));

    traceStore.set(traceId, {
      traceId,
      query,
      timestamp: new Date().toISOString(),
      overallLatencyMs,
      status: 'FAILED',
      stepLogs,
      metrics: { inputTokens: 0, outputTokens: 0, estimatedCost: 0 },
    });

    log.error({ traceId, error: err.message }, '=== Baseline Pipeline Failed ===');
    throw err;
  }
}
