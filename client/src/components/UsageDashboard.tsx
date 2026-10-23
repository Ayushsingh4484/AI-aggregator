import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Coins,
  Zap,
  Clock,
  Download,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';
import { AnalyticsData } from '../types';
import { api } from '../services/api';

export const UsageDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (!data || !data.recentLogs) return;
    const headers = 'ID,Timestamp,Model,Provider,InputTokens,OutputTokens,CostUSD,LatencyMs,Success\n';
    const rows = data.recentLogs
      .map(
        (l) =>
          `"${l.id}","${new Date(l.timestamp).toISOString()}","${l.modelId}","${l.provider}",${l.inputTokens},${l.outputTokens},${l.costUSD},${l.latencyMs},${l.success}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_ai_usage_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const providerColors: Record<string, string> = {
    anthropic: 'bg-amber-500 text-amber-400',
    openai: 'bg-emerald-500 text-emerald-400',
    google: 'bg-blue-500 text-blue-400',
    groq: 'bg-orange-500 text-orange-400',
    deepseek: 'bg-cyan-500 text-cyan-400',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-charcoal-900/60 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-3">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Real-Time Spend & Telemetry</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Usage & Cost Analytics
            </h2>
            <p className="text-xs md:text-sm text-charcoal-400 mt-1">
              Audit token consumption, provider expenditure, and sub-second latency across all connected models.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-300 hover:text-white border border-charcoal-750 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-200 hover:text-white border border-charcoal-750 text-xs font-semibold shadow-subtle transition-all"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-4 shadow-elevated">
            <div className="flex items-center justify-between text-xs text-charcoal-400 mb-2">
              <span>Total API Queries</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {data?.summary.totalRequests.toLocaleString() || '0'}
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1">
              Multi-model executions
            </div>
          </div>

          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-4 shadow-elevated">
            <div className="flex items-center justify-between text-xs text-charcoal-400 mb-2">
              <span>Tokens Processed</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {((data?.summary.totalInputTokens || 0) + (data?.summary.totalOutputTokens || 0)).toLocaleString()}
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1">
              {data?.summary.totalInputTokens.toLocaleString()} in • {data?.summary.totalOutputTokens.toLocaleString()} out
            </div>
          </div>

          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-4 shadow-elevated">
            <div className="flex items-center justify-between text-xs text-charcoal-400 mb-2">
              <span>Estimated Cost</span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              ${data?.summary.totalCostUSD.toFixed(4) || '0.0000'}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-1 flex items-center space-x-1">
              <TrendingDown className="w-3 h-3" />
              <span>Smart routing saves ~38%</span>
            </div>
          </div>

          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-4 shadow-elevated">
            <div className="flex items-center justify-between text-xs text-charcoal-400 mb-2">
              <span>Avg Latency</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {data?.summary.avgLatencyMs || '0'}ms
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1">
              Groq LPU: sub-250ms
            </div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-5 shadow-elevated mb-6">
          <h3 className="text-sm font-bold text-white mb-4">
            Provider Token & Cost Distribution
          </h3>
          <div className="space-y-4">
            {['anthropic', 'openai', 'google', 'groq', 'deepseek'].map((prov) => {
              const stats = data?.providerStats?.[prov] || { requests: 0, cost: 0, tokens: 0 };
              const totalTokens = (data?.summary.totalInputTokens || 0) + (data?.summary.totalOutputTokens || 0);
              const percentage = totalTokens ? Math.round((stats.tokens / totalTokens) * 100) : 0;
              const colorInfo = providerColors[prov] || 'bg-primary text-primary';

              return (
                <div key={prov} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-charcoal-200 uppercase font-mono text-[11px]">
                        {prov}
                      </span>
                      <span className="text-charcoal-500 text-[11px]">
                        ({stats.requests} requests)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono text-[11px]">
                      <span className="text-charcoal-400">{stats.tokens.toLocaleString()} tok</span>
                      <span className="text-emerald-400 font-semibold">${stats.cost.toFixed(4)}</span>
                      <span className="text-charcoal-500 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-charcoal-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorInfo.split(' ')[0]}`}
                      style={{ width: `${Math.max(percentage, stats.requests > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Requests Audit Table */}
        <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-5 shadow-elevated overflow-hidden">
          <h3 className="text-sm font-bold text-white mb-4">
            Recent Telemetry Audit Log
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] text-charcoal-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Model</th>
                  <th className="pb-3 font-semibold">Provider</th>
                  <th className="pb-3 font-semibold">Input / Output</th>
                  <th className="pb-3 font-semibold">Latency</th>
                  <th className="pb-3 font-semibold text-right">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800/60 text-charcoal-300">
                {data?.recentLogs && data.recentLogs.length > 0 ? (
                  data.recentLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-charcoal-900/40">
                      <td className="py-2.5 text-charcoal-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 font-sans font-semibold text-charcoal-200">
                        {log.modelId}
                      </td>
                      <td className="py-2.5 uppercase text-[11px] text-charcoal-400">
                        {log.provider}
                      </td>
                      <td className="py-2.5">
                        {log.inputTokens} / {log.outputTokens}
                      </td>
                      <td className="py-2.5">
                        {log.latencyMs}ms
                      </td>
                      <td className="py-2.5 text-right text-emerald-400 font-semibold">
                        ${log.costUSD.toFixed(5)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-charcoal-500 font-sans">
                      No usage logs recorded yet. Send prompts in Chat or Arena to see live telemetry!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
