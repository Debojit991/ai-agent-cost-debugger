import { PipelineRequest, PipelineResult, StepResult } from '../types/agent.types';
import { getTraceLogger } from '../logging/logger';
import { pruneContext } from '../optimization/token_pruner';
import { routeModel } from '../optimization/router';
import { callGeminiStep } from '../optimization/gemini_client';
import { traceStore, StepTraceLog } from '../logging/trace_store';

function generateUncompressedContext(): string {
  const baseText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. AI agent architecture requires token cost optimization. ";
  return baseText.repeat(2000); // approx 25,000 words (100,000 chars = 25,000 tokens)
}

/**
 * Optimized Execution Pipeline
 * 
 * Executes live API calls to Google Gemini (`gemini-3.5-flash` for heavy reasoning and `gemini-2.0-flash` for lightweight steps).
 * Extracts exact token counts directly from Gemini response usageMetadata.
 * Downstream steps receive pruned context (max 5,000 tokens) to minimize input token burn.
 * Records step execution telemetry to global `traceStore`.
 * 
 * @param req PipelineRequest containing user query and unique traceId
 * @returns Promise<PipelineResult>
 */
export async function runOptimizedPipeline(req: PipelineRequest): Promise<PipelineResult> {
  const { query, traceId } = req;
  const log = getTraceLogger(traceId);
  const overallStartTime = Date.now();

  log.info({ query, traceId }, '=== Starting Optimized Live Gemini Pipeline Execution ===');

  const uncompressedContext = generateUncompressedContext();
  const steps: StepResult[] = [];
  const stepLogs: StepTraceLog[] = [];
  let totalCost = 0;

  try {
    // Step 1: Planner (gemini-3.5-flash)
    const plannerRoute = routeModel('Planner');
    const plannerPrompt = `You are a Principal AI Architect. Create a concise 3-step action plan for query: "${query}".`;
    const plannerRes = await callGeminiStep(plannerRoute.modelName, plannerPrompt, traceId);
    const plannerCost = (plannerRes.inputTokens / 1000) * plannerRoute.costPer1k;
    totalCost += plannerCost;

    steps.push({
      stepName: 'Planner',
      latencyMs: plannerRes.latencyMs,
      tokensConsumed: plannerRes.inputTokens,
      outputContext: plannerRes.text,
    });
    stepLogs.push({
      stepName: 'Planner',
      attempt: 1,
      status: 'PASSED',
      latencyMs: plannerRes.latencyMs,
      payload: {
        stepName: 'Planner',
        modelName: plannerRoute.modelName,
        inputTokens: plannerRes.inputTokens,
        outputTokens: plannerRes.outputTokens,
        outputContext: plannerRes.text,
      },
    });

    // Compress Context down to max 5,000 tokens for downstream steps
    const { prunedContext, tokensSaved } = pruneContext(uncompressedContext, 5000);
    log.info({ tokensSaved, maxTokens: 5000 }, '[OptimizedPipeline] Compressed context for downstream steps');

    // Step 2: Researcher (gemini-3.5-flash with pruned context)
    const researcherRoute = routeModel('Researcher');
    const researcherPrompt = `You are an AI Systems Researcher. Analyze this pruned context: "${prunedContext.slice(0, 800)}..." and plan: "${plannerRes.text.slice(0, 200)}". Provide concise technical findings for query: "${query}".`;
    const researcherRes = await callGeminiStep(researcherRoute.modelName, researcherPrompt, traceId);
    const researcherCost = (researcherRes.inputTokens / 1000) * researcherRoute.costPer1k;
    totalCost += researcherCost;

    steps.push({
      stepName: 'Researcher',
      latencyMs: researcherRes.latencyMs,
      tokensConsumed: researcherRes.inputTokens,
      outputContext: researcherRes.text,
    });
    stepLogs.push({
      stepName: 'Researcher',
      attempt: 1,
      status: 'PASSED',
      latencyMs: researcherRes.latencyMs,
      payload: {
        stepName: 'Researcher',
        modelName: researcherRoute.modelName,
        inputTokens: researcherRes.inputTokens,
        outputTokens: researcherRes.outputTokens,
        outputContext: researcherRes.text,
      },
    });

    // Step 3: Summarizer (gemini-2.0-flash)
    const summarizerRoute = routeModel('Summarizer');
    const summarizerPrompt = `Summarize research findings into key bullet points: "${researcherRes.text.slice(0, 300)}".`;
    const summarizerRes = await callGeminiStep(summarizerRoute.modelName, summarizerPrompt, traceId);
    const summarizerCost = (summarizerRes.inputTokens / 1000) * summarizerRoute.costPer1k;
    totalCost += summarizerCost;

    steps.push({
      stepName: 'Summarizer',
      latencyMs: summarizerRes.latencyMs,
      tokensConsumed: summarizerRes.inputTokens,
      outputContext: summarizerRes.text,
    });
    stepLogs.push({
      stepName: 'Summarizer',
      attempt: 1,
      status: 'PASSED',
      latencyMs: summarizerRes.latencyMs,
      payload: {
        stepName: 'Summarizer',
        modelName: summarizerRoute.modelName,
        inputTokens: summarizerRes.inputTokens,
        outputTokens: summarizerRes.outputTokens,
        outputContext: summarizerRes.text,
      },
    });

    // Step 4: Formatter (gemini-2.0-flash)
    const formatterRoute = routeModel('Formatter');
    const formatterPrompt = `Format this final summary into a clean production response for query "${query}": "${summarizerRes.text.slice(0, 300)}".`;
    const formatterRes = await callGeminiStep(formatterRoute.modelName, formatterPrompt, traceId);
    const formatterCost = (formatterRes.inputTokens / 1000) * formatterRoute.costPer1k;
    totalCost += formatterCost;

    steps.push({
      stepName: 'Formatter',
      latencyMs: formatterRes.latencyMs,
      tokensConsumed: formatterRes.inputTokens,
      outputContext: formatterRes.text,
    });
    stepLogs.push({
      stepName: 'Formatter',
      attempt: 1,
      status: 'PASSED',
      latencyMs: formatterRes.latencyMs,
      payload: {
        stepName: 'Formatter',
        modelName: formatterRoute.modelName,
        inputTokens: formatterRes.inputTokens,
        outputTokens: formatterRes.outputTokens,
        outputContext: formatterRes.text,
      },
    });

    const overallLatencyMs = Date.now() - overallStartTime;
    const totalInputTokens = steps.reduce((sum, s) => sum + s.tokensConsumed, 0);
    const totalOutputTokens = plannerRes.outputTokens + researcherRes.outputTokens + summarizerRes.outputTokens + formatterRes.outputTokens;

    // Record Telemetry to Global traceStore
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
        estimatedCost: totalCost,
      },
    });

    log.info(
      {
        overallLatencyMs,
        totalInputTokens,
        totalOutputTokens,
        estimatedCost: `$${totalCost.toFixed(6)}`,
      },
      '=== Optimized Live Gemini Pipeline Execution Complete ==='
    );

    return {
      traceId,
      response: formatterRes.text,
      latencyMs: overallLatencyMs,
      metrics: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        estimatedCost: totalCost,
      },
    };
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

    log.error({ traceId, error: err.message }, '=== Optimized Pipeline Execution Failed ===');
    throw err;
  }
}
