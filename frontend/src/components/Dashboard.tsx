import React, { useState } from 'react';
import axios from 'axios';
import {
  Zap,
  DollarSign,
  Clock,
  Cpu,
  Play,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  FileText,
  RefreshCw,
  Bug,
  ShieldCheck,
  TrendingDown,
  Layers,
  Search,
  ChevronRight,
  Terminal,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  PipelineExecutionResponse,
  PipelineRunHistoryItem,
  PipelineTraceTelemetry,
  StepMetricChartItem
} from '../types/metrics.types';

export const Dashboard: React.FC = () => {
  const [queryInput, setQueryInput] = useState<string>(
    'Analyze distributed microservices log data for unoptimized LLM token burn'
  );

  const [loadingPipeline, setLoadingPipeline] = useState<'baseline' | 'optimized' | 'flaky' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [latestBaselineRun, setLatestBaselineRun] = useState<PipelineExecutionResponse | null>(null);
  const [latestOptimizedRun, setLatestOptimizedRun] = useState<PipelineExecutionResponse | null>(null);
  const [currentRun, setCurrentRun] = useState<PipelineExecutionResponse | null>(null);
  const [currentRunType, setCurrentRunType] = useState<'baseline' | 'optimized' | 'flaky' | null>(null);

  const [runHistory, setRunHistory] = useState<PipelineRunHistoryItem[]>([]);
  const [activeTraceTelemetry, setActiveTraceTelemetry] = useState<PipelineTraceTelemetry | null>(null);
  const [loadingTrace, setLoadingTrace] = useState<boolean>(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  // Trigger Pipeline Execution Handler
  const executePipeline = async (type: 'baseline' | 'optimized' | 'flaky') => {
    setLoadingPipeline(type);
    setError(null);

    const endpointMap = {
      baseline: '/api/pipeline/baseline',
      optimized: '/api/pipeline/optimized',
      flaky: '/api/pipeline/flaky',
    };

    try {
      const response = await axios.post<PipelineExecutionResponse>(endpointMap[type], {
        query: queryInput,
      });

      const data = response.data;
      setCurrentRun(data);
      setCurrentRunType(type);
      setSelectedTraceId(data.traceId);

      if (type === 'baseline') setLatestBaselineRun(data);
      if (type === 'optimized') setLatestOptimizedRun(data);

      const historyItem: PipelineRunHistoryItem = {
        ...data,
        timestamp: new Date().toLocaleTimeString(),
        query: queryInput,
        pipelineType: type,
        status: 'success',
      };

      setRunHistory((prev) => [historyItem, ...prev]);

      // Automatically fetch trace telemetry if trace endpoint available
      fetchTraceTelemetry(data.traceId);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Pipeline execution failed';
      setError(msg);

      if (err.response?.data?.traceId) {
        fetchTraceTelemetry(err.response.data.traceId);
      }
    } finally {
      setLoadingPipeline(null);
    }
  };

  // Fetch Trace Telemetry Details
  const fetchTraceTelemetry = async (traceId: string) => {
    setLoadingTrace(true);
    try {
      const res = await axios.get<PipelineTraceTelemetry>(`/api/trace/${traceId}`);
      setActiveTraceTelemetry(res.data);
      setSelectedTraceId(traceId);
    } catch (err: any) {
      setActiveTraceTelemetry(null);
    } finally {
      setLoadingTrace(false);
    }
  };

  // Dynamic Chart Dataset (Comparison Baseline vs Optimized)
  const chartData: StepMetricChartItem[] = [
    {
      stepName: 'Planner',
      baselineTokens: 25000,
      optimizedTokens: 25000,
      baselineCost: 0.075,
      optimizedCost: 0.075,
      latencyMs: 1000,
    },
    {
      stepName: 'Researcher',
      baselineTokens: 25000,
      optimizedTokens: 5000,
      baselineCost: 0.075,
      optimizedCost: 0.015,
      latencyMs: 1200,
    },
    {
      stepName: 'Summarizer',
      baselineTokens: 25000,
      optimizedTokens: 5000,
      baselineCost: 0.075,
      optimizedCost: 0.000375,
      latencyMs: 900,
    },
    {
      stepName: 'Formatter',
      baselineTokens: 25000,
      optimizedTokens: 5000,
      baselineCost: 0.075,
      optimizedCost: 0.000375,
      latencyMs: 900,
    },
  ];

  // Calculated Savings Percentage
  const calculatedSavingsPct = latestBaselineRun && latestOptimizedRun
    ? (
        ((latestBaselineRun.metrics.estimatedCost - latestOptimizedRun.metrics.estimatedCost) /
          latestBaselineRun.metrics.estimatedCost) *
        100
      ).toFixed(1)
    : '69.8';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6 font-sans">
      {/* Top Header Navigation */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-zinc-850">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Agent Cost Debugger</h1>
              <span className="px-2 py-0.5 text-xs font-mono bg-zinc-800 text-cyan-400 rounded border border-zinc-700">
                v2.0-Production
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Real-Time LLM Token Observability & Resiliency Platform</p>
          </div>
        </div>

        {/* Global Savings Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-cyan-950/80 to-purple-950/80 border border-cyan-500/30 rounded-xl flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs text-zinc-400 font-medium">Cost Savings Active</div>
              <div className="text-sm font-bold text-cyan-300 font-mono">-{calculatedSavingsPct}% Reduction</div>
            </div>
          </div>
        </div>
      </header>

      {/* Control Panel: Trigger Pipeline Buttons */}
      <section className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Pipeline Execution Controls
          </h2>
          <span className="text-xs text-zinc-500 font-mono">Target Host: http://localhost:3001</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Enter prompt query to execute across agent pipelines..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Button 1: Baseline */}
            <button
              onClick={() => executePipeline('baseline')}
              disabled={loadingPipeline !== null}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-amber-300 font-medium px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all border border-amber-500/20 hover:border-amber-500/40"
            >
              {loadingPipeline === 'baseline' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Running Baseline...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Run Baseline ($0.30)
                </>
              )}
            </button>

            {/* Button 2: Optimized */}
            <button
              onClick={() => executePipeline('optimized')}
              disabled={loadingPipeline !== null}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
            >
              {loadingPipeline === 'optimized' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" /> Running Optimized...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" /> Run Optimized (-69.8%)
                </>
              )}
            </button>

            {/* Button 3: Flaky Debug */}
            <button
              onClick={() => executePipeline('flaky')}
              disabled={loadingPipeline !== null}
              className="bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 text-purple-300 font-medium px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all border border-purple-500/30 hover:border-purple-500/50"
            >
              {loadingPipeline === 'flaky' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Simulating Flaky...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4 text-purple-400" /> Run Flaky (Debug Resiliency)
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-center gap-2.5 animate-shake">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="font-mono text-xs">{error}</span>
          </div>
        )}
      </section>

      {/* Metrics Cards Grid */}
      {(() => {
        const cardConfig =
          currentRunType === 'optimized'
            ? {
                costSubtext: 'Pruned & routed pricing model',
                tokensSubtext: 'Context compressed dynamically',
                latencySubtext: 'Optimized processing response',
                textColor: 'text-cyan-400',
                defaultCost: '0.0908',
                defaultTokens: '40,000',
                defaultLatency: '2,463 ms',
              }
            : currentRunType === 'flaky'
            ? {
                costSubtext: 'Simulated resiliency mode',
                tokensSubtext: 'Variable based on retries',
                latencySubtext: 'Includes exponential backoff delay',
                textColor: 'text-purple-400',
                defaultCost: '0.0908',
                defaultTokens: '40,000',
                defaultLatency: '2,899 ms',
              }
            : {
                costSubtext: 'Unoptimized sequential API burn',
                tokensSubtext: 'Full 25k uncompressed context per step',
                latencySubtext: 'Standard sequential step delay',
                textColor: 'text-amber-400',
                defaultCost: '0.3000',
                defaultTokens: '100,000',
                defaultLatency: '4,067 ms',
              };

        return (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Estimated Cost */}
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Estimated Cost</span>
                <DollarSign className={`w-5 h-5 ${cardConfig.textColor}`} />
              </div>
              <div className={`text-3xl font-bold font-mono tracking-tight ${loadingPipeline ? 'animate-pulse text-zinc-500' : 'text-white'}`}>
                ${currentRun ? currentRun.metrics.estimatedCost.toFixed(4) : cardConfig.defaultCost}
              </div>
              <div className={`flex items-center gap-1 text-xs ${cardConfig.textColor} mt-2 font-medium`}>
                <TrendingDown className="w-3.5 h-3.5" /> {cardConfig.costSubtext}
              </div>
            </div>

            {/* Card 2: Input Token Burn */}
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Input Tokens</span>
                <Cpu className={`w-5 h-5 ${cardConfig.textColor}`} />
              </div>
              <div className={`text-3xl font-bold font-mono tracking-tight ${loadingPipeline ? 'animate-pulse text-zinc-500' : 'text-white'}`}>
                {currentRun ? currentRun.metrics.inputTokens.toLocaleString() : cardConfig.defaultTokens}
              </div>
              <div className={`text-xs ${cardConfig.textColor} mt-2 font-medium flex items-center gap-1`}>
                <Layers className="w-3.5 h-3.5" /> {cardConfig.tokensSubtext}
              </div>
            </div>

            {/* Card 3: End-to-End Latency */}
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Latency</span>
                <Clock className={`w-5 h-5 ${cardConfig.textColor}`} />
              </div>
              <div className={`text-3xl font-bold font-mono tracking-tight ${loadingPipeline ? 'animate-pulse text-zinc-500' : 'text-white'}`}>
                {currentRun ? `${currentRun.latencyMs} ms` : cardConfig.defaultLatency}
              </div>
              <div className={`text-xs ${cardConfig.textColor} mt-2 font-medium flex items-center gap-1`}>
                <Zap className="w-3.5 h-3.5" /> {cardConfig.latencySubtext}
              </div>
            </div>

            {/* Card 4: Active Trace ID */}
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Trace ID</span>
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-xs font-mono font-medium text-cyan-300 truncate mt-1">
                {selectedTraceId || 'Click run or trace row'}
              </div>
              <button
                onClick={() => selectedTraceId && fetchTraceTelemetry(selectedTraceId)}
                disabled={!selectedTraceId || loadingTrace}
                className="mt-3 text-xs text-zinc-400 hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
              >
                {loadingTrace ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />} Fetch Telemetry
              </button>
            </div>
          </section>
        );
      })()}

      {/* Main Content Grid: Recharts & Trace Tree Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Step Token Breakdown & Baseline vs Optimized Comparison */}
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Token Reduction Comparison
            </h3>
            <span className="text-xs font-mono text-zinc-500">Baseline (100k) vs Optimized (40k)</span>
          </div>

          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="stepName" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="baselineTokens" name="Baseline Tokens" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimizedTokens" name="Optimized Tokens" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component: Interactive Trace Execution Tree Viewer */}
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" /> Trace Execution Tree
            </h3>
            {activeTraceTelemetry && (
              <span className="text-xs font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                Trace: {activeTraceTelemetry.traceId}
              </span>
            )}
          </div>

          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-80 space-y-3">
            {!activeTraceTelemetry ? (
              <div className="text-zinc-500 italic text-center py-10">
                <Bug className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                No active telemetry loaded. Click "Run Flaky (Debug)" or select a trace from history below.
              </div>
            ) : (
              <div>
                <div className="pb-3 mb-3 border-b border-zinc-800 text-zinc-400">
                  <div>ROOT (Pipeline Request: "{activeTraceTelemetry.query}")</div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">Overall Duration: {activeTraceTelemetry.overallLatencyMs} ms</div>
                </div>

                <div className="space-y-3">
                  {activeTraceTelemetry.stepLogs.map((step, idx) => {
                    const isPassed = step.status === 'PASSED';
                    const isRetried = step.status === 'RETRIED';
                    const isFailed = step.status === 'FAILED';

                    return (
                      <div key={idx} className="pl-3 border-l-2 border-zinc-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">
                            [Step {idx + 1}] {step.stepName} (Attempt {step.attempt})
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isRetried
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>

                        <div className="text-zinc-400 text-[11px]">Latency: {step.latencyMs} ms</div>

                        {step.error && (
                          <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-[11px]">
                            ⚠️ {step.error}
                          </div>
                        )}

                        {step.payload && (
                          <div className="text-zinc-500 text-[10px] truncate max-w-md">
                            Payload: {JSON.stringify(step.payload).slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution History Log Table */}
      <section className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" /> Recent Execution History
        </h3>

        {runHistory.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center italic">No executions recorded in this dashboard session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 text-xs font-mono uppercase border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Pipeline Type</th>
                  <th className="px-4 py-3">Trace ID</th>
                  <th className="px-4 py-3">Input Tokens</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {runHistory.map((item, index) => (
                  <tr
                    key={index}
                    onClick={() => {
                      setCurrentRun(item);
                      setCurrentRunType(item.pipelineType);
                      fetchTraceTelemetry(item.traceId);
                    }}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-zinc-400">{item.timestamp}</td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          item.pipelineType === 'optimized'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : item.pipelineType === 'flaky'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.pipelineType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-cyan-300">{item.traceId.slice(0, 12)}...</td>
                    <td className="px-4 py-3 text-xs font-mono text-purple-300">{item.metrics.inputTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-mono">{item.latencyMs} ms</td>
                    <td className="px-4 py-3 text-xs font-mono text-emerald-400">${item.metrics.estimatedCost.toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentRun(item);
                          setCurrentRunType(item.pipelineType);
                          fetchTraceTelemetry(item.traceId);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                      >
                        Inspect <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
