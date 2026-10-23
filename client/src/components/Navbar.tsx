import React from 'react';
import { 
  Menu, 
  Layers, 
  Compass, 
  Settings, 
  Sparkles,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { AIModelInfo, ProviderStatus, ActiveView } from '../types';
import { ModelSelector } from './ModelSelector';

interface NavbarProps {
  activeView: ActiveView;
  models: AIModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  providerStatus?: ProviderStatus | null;
  onOpenSettings: () => void;
  onOpenCompare: () => void;
  isAutoRouteEnabled: boolean;
  onToggleAutoRoute: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  models,
  selectedModelId,
  onSelectModel,
  providerStatus,
  onOpenSettings,
  onOpenCompare,
  isAutoRouteEnabled,
  onToggleAutoRoute,
  onToggleMobileSidebar,
}) => {
  const viewTitles: Record<ActiveView, { title: string; subtitle: string }> = {
    chat: { title: 'Unified AI Chat', subtitle: 'Converse with top frontier models' },
    compare: { title: 'Compare AI Arena', subtitle: 'Side-by-side prompt battle across 2-4 models' },
    router: { title: 'Smart Model Router', subtitle: 'Intent analysis & model matchmaker' },
    workspaces: { title: 'Specialized Studios', subtitle: 'Coding, Writing, Research & Summarization' },
    prompts: { title: 'Prompt Library', subtitle: 'Curated engineering & creative templates' },
    analytics: { title: 'Usage & Cost Analytics', subtitle: 'Real-time token and spend tracking' },
    settings: { title: 'Settings & API Keys', subtitle: 'Bring your own keys & configurations' },
  };

  const current = viewTitles[activeView] || viewTitles.chat;

  return (
    <header className="h-14 border-b border-charcoal-800/80 bg-charcoal-950/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-20">
      {/* Left: Mobile Menu + View Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm font-semibold text-charcoal-100 flex items-center space-x-2">
            <span>{current.title}</span>
            {isAutoRouteEnabled && activeView === 'chat' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Auto-Route Active
              </span>
            )}
          </h1>
          <p className="text-[11px] text-charcoal-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Auto Route Toggle (In Chat View) */}
        {activeView === 'chat' && (
          <button
            onClick={onToggleAutoRoute}
            className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isAutoRouteEnabled
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-charcoal-900 border-charcoal-800 text-charcoal-400 hover:text-charcoal-200'
            }`}
            title="Automatically detect prompt complexity and select the optimal model"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Smart Router</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAutoRouteEnabled ? 'bg-primary animate-pulse' : 'bg-charcoal-600'
              }`}
            />
          </button>
        )}

        {/* Model Selector Dropdown (When in chat or workspaces) */}
        {(activeView === 'chat' || activeView === 'workspaces') && (
          <ModelSelector
            models={models}
            selectedModelId={selectedModelId}
            onSelectModel={onSelectModel}
            providerStatus={providerStatus}
            onOpenSettings={onOpenSettings}
            compact
          />
        )}

        {/* Quick Arena Button (When not already in compare) */}
        {activeView !== 'compare' && (
          <button
            onClick={onOpenCompare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-charcoal-900 hover:bg-charcoal-800 border border-charcoal-700/70 text-charcoal-200 hover:text-white transition-all shadow-subtle"
            title="Open 2-4 model side-by-side arena"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Compare Arena</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-900 border border-transparent hover:border-charcoal-800 transition-colors"
          title="API Keys & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
