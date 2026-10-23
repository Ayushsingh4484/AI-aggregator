import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import {
  Layers,
  Sparkles,
  Zap,
  Clock,
  Coins,
  Trophy,
  Copy,
  Check,
  Send,
  Plus,
  X,
  Swords,
  ChevronDown
} from 'lucide-react';
import { AIModelInfo } from '../types';
import { api } from '../services/api';
import { CodeBlock } from './CodeBlock';

interface CompareViewProps {
  models: AIModelInfo[];
  initialPrompt?: string;
}

interface ModelResult {
  modelId: string;
  content: string;
  thinking?: string;
  metrics: {
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
    latencyMs: number;
    totalTimeMs?: number;
    isSimulated?: boolean;
  };
  success: boolean;
}

export const CompareView: React.FC<CompareViewProps> = ({ models, initialPrompt = '' }) => {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([
    'claude-3-5-sonnet',
    'gpt-4o',
    'gemini-1-5-pro',
  ]);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Record<string, ModelResult>>({});
  const [winnerModelId, setWinnerModelId] = useState<string | null>(null);
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null);

  const presets = [
    {
      title: 'Frontier Heavyweights',
      models: ['claude-3-5-sonnet', 'gpt-4o', 'gemini-1-5-pro'],
      description: 'The top 3 frontier foundation models'
    },
    {
      title: 'Speed Showdown',
      models: ['groq-llama-3-3-70b', 'gemini-2-0-flash', 'gpt-4o-mini'],
      description: 'Ultra-low latency inference battle'
    },
    {
      title: 'Reasoning Duel',
      models: ['deepseek-reasoner', 'claude-3-5-sonnet'],
      description: 'Chain-of-thought vs code architecture'
    }
  ];

  const handleToggleModel = (modelId: string) => {
    if (selectedModelIds.includes(modelId)) {
      if (selectedModelIds.length > 2) {
        setSelectedModelIds(selectedModelIds.filter((id) => id !== modelId));
      }
    } else {
      if (selectedModelIds.length < 4) {
        setSelectedModelIds([...selectedModelIds, modelId]);
      }
    }
  };

  const handleRunComparison = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setResults({});
    setWinnerModelId(null);

    try {
      const response = await api.compareModels(prompt.trim(), selectedModelIds);
      const resMap: Record<string, ModelResult> = {};
      response.results.forEach((r: any) => {
        resMap[r.modelId] = r;
      });
      setResults(resMap);
    } catch (e) {
      console.error('Comparison error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickWinner = (modelId: string) => {
    setWinnerModelId(modelId);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10a37f', '#3b82f6', '#8b5cf6', '#f59e0b'],
    });
  };

  const handleCopy = (modelId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedModelId(modelId);
    setTimeout(() => setCopiedModelId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-charcoal-900/60 overflow-y-auto">
      {/* Header Banner */}
      <div className="border-b border-charcoal-800/80 bg-charcoal-950/70 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-semibold border border-purple-500/20 mb-2">
                <Swords className="w-3.5 h-3.5" />
                <span>Multi-Model AI Arena</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Compare AI Models Side-by-Side
              </h2>
              <p className="text-xs text-charcoal-400 mt-1">
                Broadcast one prompt simultaneously to 2, 3, or 4 models. Compare latency, token cost, and quality.
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedModelIds(p.models)}
                  className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-charcoal-700/60 text-xs text-charcoal-300 hover:text-white transition-all"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-charcoal-800/60">
            <span className="text-xs font-semibold text-charcoal-400 mr-2">
              Competing ({selectedModelIds.length}/4):
            </span>
            {models.map((m) => {
              const isSelected = selectedModelIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => handleToggleModel(m.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-primary/10 text-primary border-primary/40 shadow-subtle'
                      : 'bg-charcoal-900 text-charcoal-400 border-charcoal-800 hover:text-charcoal-200'
                  }`}
                >
                  <span>{m.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prompt Broadcast Input */}
      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="rounded-2xl bg-charcoal-900 border border-charcoal-750 shadow-premium p-3 focus-within:border-primary/80 transition-all mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type a benchmark prompt or challenge to broadcast to all selected models..."
            rows={3}
            className="w-full bg-transparent p-2 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between pt-2 border-t border-charcoal-800/60">
            <div className="text-[11px] text-charcoal-500">
              Broadcasting to: {selectedModelIds.map(id => models.find(m => m.id === id)?.name).join(', ')}
            </div>
            <button
              onClick={handleRunComparison}
              disabled={!prompt.trim() || isLoading}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                prompt.trim() && !isLoading
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-glow cursor-pointer'
                  : 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Across Models...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Run Comparison Arena</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div
          className={`grid gap-4 ${
            selectedModelIds.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : selectedModelIds.length === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {selectedModelIds.map((modelId) => {
            const modelInfo = models.find((m) => m.id === modelId);
            const res = results[modelId];
            const isWinner = winnerModelId === modelId;

            return (
              <div
                key={modelId}
                className={`rounded-2xl border flex flex-col justify-between bg-charcoal-950/90 shadow-elevated transition-all overflow-hidden ${
                  isWinner
                    ? 'border-amber-400/80 ring-2 ring-amber-400/20'
                    : 'border-charcoal-800 hover:border-charcoal-700'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-charcoal-800/80 bg-charcoal-900/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-charcoal-100 truncate">
                      {modelInfo?.name || modelId}
                    </span>
                    {isWinner && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                        <Trophy className="w-3 h-3 fill-amber-300" />
                        <span>WINNER</span>
                      </span>
                    )}
                  </div>

                  {/* Metrics Bar */}
                  {res?.metrics ? (
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-charcoal-400">
                      <span className="flex items-center space-x-1 bg-charcoal-800 px-2 py-0.5 rounded">
                        <Clock className="w-2.5 h-2.5 text-charcoal-400" />
                        <span>{res.metrics.latencyMs}ms</span>
                      </span>
                      <span className="flex items-center space-x-1 bg-charcoal-800 px-2 py-0.5 rounded">
                        <Zap className="w-2.5 h-2.5 text-charcoal-400" />
                        <span>{res.metrics.outputTokens} tok</span>
                      </span>
                      <span className="flex items-center space-x-1 bg-charcoal-800 px-2 py-0.5 rounded text-emerald-400">
                        <Coins className="w-2.5 h-2.5" />
                        <span>${res.metrics.costUSD.toFixed(5)}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-charcoal-500 font-mono">
                      {isLoading ? 'Streaming in parallel...' : 'Ready for test'}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 overflow-y-auto max-h-[500px] text-xs leading-relaxed text-charcoal-200">
                  {isLoading && !res ? (
                    <div className="space-y-3 py-6">
                      <div className="h-4 bg-charcoal-800/60 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-charcoal-800/60 rounded animate-pulse w-full" />
                      <div className="h-4 bg-charcoal-800/60 rounded animate-pulse w-5/6" />
                    </div>
                  ) : res ? (
                    <>
                      {res.thinking && (
                        <div className="mb-3 p-2.5 rounded-lg bg-charcoal-900 border border-charcoal-800 text-[11px] text-charcoal-400 font-mono">
                          <div className="font-semibold text-cyan-400 mb-1">Reasoning Trace:</div>
                          {res.thinking}
                        </div>
                      )}
                      <div className="prose-custom text-xs">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              return !inline ? (
                                <CodeBlock language={match ? match[1] : 'text'} value={codeString} />
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {res.content}
                        </ReactMarkdown>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 text-charcoal-500">
                      Response will appear here
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                {res && (
                  <div className="p-3 border-t border-charcoal-800/80 bg-charcoal-900/40 flex items-center justify-between">
                    <button
                      onClick={() => handleCopy(modelId, res.content)}
                      className="flex items-center space-x-1 text-xs text-charcoal-400 hover:text-white transition-colors"
                    >
                      {copiedModelId === modelId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span className="text-primary">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handlePickWinner(modelId)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                        isWinner
                          ? 'bg-amber-400 text-charcoal-950 shadow-glow'
                          : 'bg-charcoal-800 hover:bg-amber-400/20 text-charcoal-300 hover:text-amber-300'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{isWinner ? 'Selected Winner' : 'Vote Winner'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
