import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { runBaselinePipeline } from '../agents/baseline_pipeline';
import { runOptimizedPipeline } from '../agents/optimized_pipeline';
import { PipelineRequest } from '../types/agent.types';

/**
 * Benchmark Script
 * 
 * Executes both baseline (unoptimized) and optimized pipelines sequentially,
 * calculates token, cost, and latency reduction percentages, and outputs a formatted ASCII comparison table.
 */
async function main() {
  console.log('\n===============================================================');
  console.log('       AI AGENT COST & TOKEN OPTIMIZATION BENCHMARK            ');
  console.log('===============================================================\n');

  const benchmarkQuery = 'Analyze enterprise microservices architecture for LLM token cost reduction';

  const baselineReq: PipelineRequest = {
    query: benchmarkQuery,
    traceId: `bm-baseline-${uuidv4().slice(0, 8)}`,
  };

  const optimizedReq: PipelineRequest = {
    query: benchmarkQuery,
    traceId: `bm-optimized-${uuidv4().slice(0, 8)}`,
  };

  console.log('1. Executing Baseline Heavy Pipeline...');
  const baselineResult = await runBaselinePipeline(baselineReq);

  console.log('\n2. Executing Optimized Context-Pruned Pipeline...');
  const optimizedResult = await runOptimizedPipeline(optimizedReq);

  // Math Calculations
  const baselineTokens = baselineResult.metrics.inputTokens;
  const optimizedTokens = optimizedResult.metrics.inputTokens;
  const tokenSavingsPct = (((baselineTokens - optimizedTokens) / baselineTokens) * 100).toFixed(2);

  const baselineCost = baselineResult.metrics.estimatedCost;
  const optimizedCost = optimizedResult.metrics.estimatedCost;
  const costSavingsPct = (((baselineCost - optimizedCost) / baselineCost) * 100).toFixed(2);

  const baselineLatency = baselineResult.latencyMs;
  const optimizedLatency = optimizedResult.latencyMs;
  const latencySavingsPct = (((baselineLatency - optimizedLatency) / baselineLatency) * 100).toFixed(2);

  // Formatted ASCII Table Output
  console.log('\n');
  console.log('+----------------------+------------------+------------------+------------------+');
  console.log('| Metric               | Baseline         | Optimized        | Savings          |');
  console.log('+----------------------+------------------+------------------+------------------+');
  console.log(
    `| Total Input Tokens   | ${baselineTokens.toLocaleString().padEnd(16)} | ${optimizedTokens.toLocaleString().padEnd(16)} | ${`-${tokenSavingsPct}%`.padEnd(16)} |`
  );
  console.log(
    `| Total Estimated Cost | ${`$${baselineCost.toFixed(4)}`.padEnd(16)} | ${`$${optimizedCost.toFixed(6)}`.padEnd(16)} | ${`-${costSavingsPct}%`.padEnd(16)} |`
  );
  console.log(
    `| End-to-End Latency   | ${`${baselineLatency} ms`.padEnd(16)} | ${`${optimizedLatency} ms`.padEnd(16)} | ${`-${latencySavingsPct}%`.padEnd(16)} |`
  );
  console.log('+----------------------+------------------+------------------+------------------+');

  console.log('\nBenchmark Summary:');
  console.log(`- Token Reduction: ${tokenSavingsPct}% fewer input tokens processed.`);
  console.log(`- Cost Reduction:  ${costSavingsPct}% lower cost per workflow execution.`);
  console.log(`- Latency Drop:    ${latencySavingsPct}% faster end-to-end execution.`);
  console.log('\n===============================================================\n');
}

main().catch((err) => {
  console.error('Error running benchmark:', err);
  process.exit(1);
});
