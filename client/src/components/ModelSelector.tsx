import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Sparkles, 
  Zap, 
  Search, 
  Brain, 
  Layers, 
  Key,
  ShieldCheck,
  Check
} from 'lucide-react';
import { AIModelInfo, ProviderStatus, DEFAULT_MODELS } from '../types';

interface ModelSelectorProps {
  models: AIModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  providerStatus?: ProviderStatus | null;
  onOpenSettings?: () => void;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  providerStatus,
  onOpenSettings,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0] || DEFAULT_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const providerIcons: Record<string, { color: string; label: string }> = {
    anthropic: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Anthropic' },
    openai: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'OpenAI' },
    google: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Google' },
    groq: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Groq LPU' },
    deepseek: { color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'DeepSeek' },
  };

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || m.categories.includes(activeCategory as any);
    return matchesSearch && matchesCategory;
  });

  const isModelKeyConfigured = (provider: string) => {
    return providerStatus?.statuses?.[provider]?.configured || false;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2.5 rounded-xl border border-charcoal-700/70 bg-charcoal-900/90 hover:bg-charcoal-800/90 text-charcoal-100 transition-all shadow-subtle ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isModelKeyConfigured(selectedModel.provider)
                ? 'bg-emerald-400 ring-2 ring-emerald-400/20'
                : 'bg-amber-400 ring-2 ring-amber-400/20'
            }`}
            title={
              isModelKeyConfigured(selectedModel.provider)
                ? 'Live API Key Connected'
                : 'Sandbox Simulation Mode'
            }
          />
          <span className="font-semibold">{selectedModel.name}</span>
        </div>

        {selectedModel.badge && !compact && (
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md font-medium bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
            {selectedModel.badge}
          </span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-charcoal-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[340px] sm:w-[420px] rounded-2xl bg-charcoal-900/95 backdrop-blur-xl border border-charcoal-700/80 shadow-elevated p-3 z-50 animate-slide-up">
          {/* Header Search & Filter */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search models or providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-charcoal-950 border border-charcoal-800 text-xs text-charcoal-200 placeholder-charcoal-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center space-x-1 mb-2.5 overflow-x-auto pb-1 text-[11px]">
            {['all', 'coding', 'reasoning', 'writing', 'fast', 'research'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-charcoal-800 text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Models List */}
          <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
            {filteredModels.map((m) => {
              const isSelected = m.id === selectedModelId;
              const hasKey = isModelKeyConfigured(m.provider);
              const pInfo = providerIcons[m.provider] || {
                color: 'bg-charcoal-800 text-charcoal-300 border-charcoal-700',
                label: m.provider,
              };

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectModel(m.id);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-charcoal-800/90 border-primary/50 ring-1 ring-primary/20'
                      : 'bg-charcoal-950/60 border-charcoal-800/60 hover:bg-charcoal-800/50 hover:border-charcoal-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${pInfo.color}`}
                      >
                        {pInfo.label}
                      </span>
                      <span className="font-semibold text-xs text-charcoal-100">
                        {m.name}
                      </span>
                      {hasKey ? (
                        <span
                          className="flex items-center text-[10px] text-emerald-400 font-medium"
                          title="Direct Live API"
                        >
                          <ShieldCheck className="w-3 h-3 mr-0.5" /> Live
                        </span>
                      ) : (
                        <span
                          className="text-[10px] text-amber-400/90 font-medium bg-amber-400/10 px-1.5 py-0.2 rounded"
                          title="Simulated Sandbox (Add API key in Settings)"
                        >
                          Sandbox
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>

                  <p className="text-[11px] text-charcoal-400 line-clamp-1">
                    {m.description}
                  </p>

                  {/* Spec Row */}
                  <div className="flex items-center justify-between text-[10px] text-charcoal-400 font-mono pt-1 border-t border-charcoal-800/40">
                    <div className="flex items-center space-x-2.5">
                      <span>Ctx: {(m.contextWindow / 1000).toLocaleString()}k</span>
                      <span>Speed: {m.speedScore}/10</span>
                      <span>Intel: {m.intelligenceScore}/10</span>
                    </div>
                    <div className="text-emerald-400/80">
                      ${m.inputCostPer1M} / 1M in
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with Settings Shortcut */}
          <div className="mt-2.5 pt-2 border-t border-charcoal-800/80 flex items-center justify-between text-[11px] text-charcoal-400">
            <span>Keys configured in Settings</span>
            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="text-primary hover:underline flex items-center space-x-1"
              >
                <Key className="w-3 h-3" />
                <span>Manage API Keys</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
