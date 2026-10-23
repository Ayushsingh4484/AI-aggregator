import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Zap, 
  Code2, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  Coins, 
  Check, 
  BrainCircuit,
  Scale
} from 'lucide-react';
import { AIModelInfo, RouteRecommendation } from '../types';
import { api } from '../services/api';

interface SmartRouterViewProps {
  models: AIModelInfo[];
  onExecutePrompt: (prompt: string, modelId: string) => void;
}

export const SmartRouterView: React.FC<SmartRouterViewProps> = ({ models, onExecutePrompt }) => {
  const [testPrompt, setTestPrompt] = useState('');
  const [preference, setPreference] = useState<'auto' | 'speed' | 'quality' | 'cost'>('auto');
  const [recommendation, setRecommendation] = useState<RouteRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const samplePrompts = [
    {
      label: 'TypeScript Architecture',
      text: 'Write a fault-tolerant WebSocket gateway in TypeScript with Redis pub/sub backplane and heartbeat reconnection.',
      pref: 'quality' as const,
    },
    {
      label: 'Mathematical Logic Proof',
      text: 'Prove that the square root of 2 is irrational using contradiction, and explain the algebraic steps rigorously.',
      pref: 'quality' as const,
    },
    {
      label: 'Rapid Translation',
      text: 'Translate this JSON localization file into conversational Spanish, French, and German.',
      pref: 'speed' as const,
    },
    {
      label: 'Massive Document Analysis',
      text: 'Analyze this 40-page quarterly earnings transcript, cross-referencing guidance with capital expenditures and GAAP operating margins.',
      pref: 'auto' as const,
    },
  ];

  const handleAnalyze = async () => {
    if (!testPrompt.trim()) return;
    setIsAnalyzing(true);
    try {
      const rec = await api.getRouteRecommendation(testPrompt.trim(), preference);
      setRecommendation(rec);
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-charcoal-900/60 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>AI Intent Matchmaker</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Smart Model Router
          </h2>
          <p className="text-xs md:text-sm text-charcoal-400 mt-1 max-w-2xl leading-relaxed">
            Our routing engine inspects prompt syntax, complexity, token context, and reasoning demands to connect you with the optimal AI model—maximizing quality while minimizing cost and latency.
          </p>
        </div>

        {/* Input Card */}
        <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-4 md:p-5 shadow-elevated mb-6">
          <label className="block text-xs font-semibold text-charcoal-300 mb-2">
            Enter prompt or task description to evaluate:
          </label>
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Paste your prompt, code snippet, or project goal here to see which model handles it best..."
            rows={4}
            className="w-full bg-charcoal-900 rounded-xl border border-charcoal-750 p-3 text-xs md:text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:border-primary resize-none leading-relaxed mb-3"
          />

          {/* Preferences and Samples */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-charcoal-800/80">
            {/* Preference Pills */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-medium text-charcoal-400 mr-1">Priority:</span>
              {[
                { id: 'auto', label: 'Balanced' },
                { id: 'quality', label: 'Max Quality' },
                { id: 'speed', label: 'Lowest Latency' },
                { id: 'cost', label: 'Cost Saver' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreference(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    preference === p.id
                      ? 'bg-primary text-white'
                      : 'bg-charcoal-900 text-charcoal-400 hover:text-charcoal-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!testPrompt.trim() || isAnalyzing}
              className={`flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                testPrompt.trim() && !isAnalyzing
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-glow cursor-pointer'
                  : 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Intent...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Route Prompt</span>
                </>
              )}
            </button>
          </div>

          {/* Sample Prompts */}
          <div className="mt-4 pt-3 border-t border-charcoal-800/60 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-charcoal-500 font-semibold uppercase mr-1">
              Try Sample:
            </span>
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTestPrompt(s.text);
                  setPreference(s.pref);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-400 hover:text-charcoal-200 transition-colors border border-charcoal-800"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation Output */}
        {recommendation && (
          <div className="space-y-4 animate-slide-up">
            {/* Top Recommended Card */}
            <div className="rounded-2xl border border-primary/50 bg-charcoal-950/90 p-5 shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      Top Recommendation
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {Math.round(recommendation.confidence * 100)}% Confidence Match
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {recommendation.modelName}
                  </h3>
                </div>

                <button
                  onClick={() => onExecutePrompt(testPrompt, recommendation.recommendedModelId)}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow transition-all"
                >
                  <span>Chat with {recommendation.modelName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rationale */}
              <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-charcoal-800/80 text-xs text-charcoal-300 leading-relaxed mb-4">
                <span className="font-semibold text-white">Why this model? </span>
                {recommendation.reasoning}
              </div>

              {/* Metric stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono text-charcoal-300">
                <div className="p-2.5 rounded-lg bg-charcoal-900/60 border border-charcoal-800/60">
                  <div className="text-[10px] text-charcoal-500 uppercase">Category</div>
                  <div className="font-semibold text-white capitalize">{recommendation.category}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-charcoal-900/60 border border-charcoal-800/60">
                  <div className="text-[10px] text-charcoal-500 uppercase">Est. Prompt Tokens</div>
                  <div className="font-semibold text-white">{recommendation.estimatedTokens} tokens</div>
                </div>
                <div className="p-2.5 rounded-lg bg-charcoal-900/60 border border-charcoal-800/60 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-charcoal-500 uppercase">Provider</div>
                  <div className="font-semibold text-white uppercase">{recommendation.provider}</div>
                </div>
              </div>
            </div>

            {/* Alternatives */}
            {recommendation.alternatives?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2 px-1">
                  Viable Alternative Models:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendation.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-charcoal-950 border border-charcoal-800/80 hover:border-charcoal-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-white mb-1">
                          {alt.modelName}
                        </div>
                        <p className="text-[11px] text-charcoal-400 leading-relaxed mb-3">
                          {alt.reason}
                        </p>
                      </div>
                      <button
                        onClick={() => onExecutePrompt(testPrompt, alt.modelId)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center space-x-1"
                      >
                        <span>Select this model</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
