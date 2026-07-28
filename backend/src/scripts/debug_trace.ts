import { v4 as uuidv4 } from 'uuid';
import { runFlakyPipeline } from '../agents/flaky_pipeline';
import { traceStore, PipelineTraceTelemetry } from '../logging/trace_store';

/**
 * Trace Diagnostic CLI Utility
 * 
 * Inspects execution traces and prints a visual ASCII execution tree of step statuses,
 * retries, latencies, error details, and JSON payloads.
 */
async function main() {
  console.log('\n===============================================================');
  console.log('         AI AGENT TRACE DIAGNOSTIC & TELEMETRY TOOL            ');
  console.log('===============================================================\n');

  const args = process.argv.slice(2);
  let targetTraceId = args[0];

  if (!targetTraceId) {
    console.log('No trace ID provided in CLI arguments. Triggering simulated flaky pipeline run to inspect trace...\n');
    targetTraceId = `flaky-${uuidv4().slice(0, 8)}`;
    try {
      await runFlakyPipeline({
        query: 'Inspect distributed trace for intermittent network timeouts and schema failures',
        traceId: targetTraceId,
      });
    } catch (e: any) {
      console.log(`Pipeline execution threw unhandled exception: ${e.message}`);
    }
  }

  const telemetry = traceStore.get(targetTraceId);

  if (!telemetry) {
    console.log(`[!] No telemetry record found in memory for Trace ID: "${targetTraceId}".`);
    console.log('Available recorded traces in store:', Array.from(traceStore.keys()));
    return;
  }

  // Visual ASCII Execution Tree Output
  console.log(`Trace ID:   ${telemetry.traceId}`);
  console.log(`Timestamp:  ${telemetry.timestamp}`);
  console.log(`Query:      "${telemetry.query}"`);
  console.log(`Status:     ${telemetry.status === 'SUCCESS' ? '🟢 SUCCESS' : '🔴 FAILED'}`);
  console.log(`Duration:   ${telemetry.overallLatencyMs} ms\n`);
  console.log('EXECUTION TREE & STEP DIAGNOSTICS:');
  console.log('ROOT (Pipeline Request)');

  telemetry.stepLogs.forEach((step, idx) => {
    const isLast = idx === telemetry.stepLogs.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    let statusBadge = '🟢 PASSED';
    if (step.status === 'RETRIED') statusBadge = '🔄 RETRIED (SUCCESS)';
    if (step.status === 'FAILED') statusBadge = '🔴 FAILED';

    console.log(`${prefix}[Step ${idx + 1}] ${step.stepName} (Attempt ${step.attempt})`);
    console.log(`${childPrefix}Status:  ${statusBadge}`);
    console.log(`${childPrefix}Latency: ${step.latencyMs} ms`);

    if (step.error) {
      console.log(`${childPrefix}Error:   ⚠️ ${step.error}`);
    }

    if (step.payload) {
      console.log(`${childPrefix}Payload: ${JSON.stringify(step.payload).slice(0, 90)}...`);
    }
    console.log(childPrefix);
  });

  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Error executing trace diagnostic CLI:', err);
  process.exit(1);
});
