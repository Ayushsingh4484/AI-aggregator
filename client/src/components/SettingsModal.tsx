import React, { useState } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  Check,
  AlertTriangle,
  Database,
  RefreshCw,
  ExternalLink,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { ProviderStatus } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerStatus: ProviderStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providerStatus,
  onRefreshStatus,
}) => {
  const [keysInput, setKeysInput] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    google: '',
    groq: '',
    deepseek: '',
  });

  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const providers = [
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      envVar: 'ANTHROPIC_API_KEY',
      docsUrl: 'https://console.anthropic.com/',
      placeholder: 'sk-ant-api03-...',
      models: 'Claude 3.5 Sonnet, Haiku, Opus'
    },
    {
      id: 'openai',
      name: 'OpenAI',
      envVar: 'OPENAI_API_KEY',
      docsUrl: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-proj-...',
      models: 'GPT-4o, GPT-4o-mini, o1, o3-mini'
    },
    {
      id: 'google',
      name: 'Google Gemini',
      envVar: 'GOOGLE_API_KEY',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      placeholder: 'AIzaSy...',
      models: 'Gemini 1.5 Pro (2M), Gemini 2.0 Flash'
    },
    {
      id: 'groq',
      name: 'Groq Cloud LPU',
      envVar: 'GROQ_API_KEY',
      docsUrl: 'https://console.groq.com/keys',
      placeholder: 'gsk_...',
      models: 'Llama 3.3 70B (~300 tokens/sec)'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek AI',
      envVar: 'DEEPSEEK_API_KEY',
      docsUrl: 'https://platform.deepseek.com/',
      placeholder: 'sk-...',
      models: 'DeepSeek R1 (Reasoning), DeepSeek V3'
    },
  ];

  const handleSaveKey = async (providerId: string) => {
    const val = keysInput[providerId]?.trim();
    if (!val) return;

    try {
      await api.saveProviderKey(providerId, val);
      setSaveSuccess((prev) => ({ ...prev, [providerId]: true }));
      setTimeout(() => setSaveSuccess((prev) => ({ ...prev, [providerId]: false })), 2500);
      onRefreshStatus();
    } catch (e) {
      console.error('Save key error:', e);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      const keyOverride = keysInput[providerId]?.trim() || undefined;
      const res = await api.testProviderConnection(providerId, keyOverride);
      setTestResult((prev) => ({ ...prev, [providerId]: res }));
    } catch (e: any) {
      setTestResult((prev) => ({
        ...prev,
        [providerId]: { success: false, message: e.message || 'Connection check failed' },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-charcoal-950 border border-charcoal-750 shadow-elevated p-6 md:p-8 animate-slide-up my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-charcoal-700 flex items-center justify-center text-primary">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Settings & AI Provider Credentials
              </h2>
              <p className="text-xs text-charcoal-400">
                Bring Your Own Key (BYOK) — Keys are stored securely and never transmitted to third parties.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-charcoal-400 hover:text-white hover:bg-charcoal-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Disclaimer Banner */}
        <div className="my-5 p-4 rounded-2xl bg-charcoal-900/80 border border-charcoal-800 text-xs text-charcoal-300 leading-relaxed flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Direct Provider Billing & Privacy: </span>
            gamoraAI aggregates models through official provider APIs. You pay each provider directly according to their standard token pricing. If an API key is not configured, models will operate in
            <strong className="text-amber-300"> Sandbox Mode</strong> for evaluation.
          </div>
        </div>

        {/* Providers Table */}
        <div className="space-y-4 mb-6">
          {providers.map((p) => {
            const status = providerStatus?.statuses?.[p.id];
            const isConfigured = status?.configured || false;
            const source = status?.source;
            const currentTest = testResult[p.id];
            const isTesting = testingProvider === p.id;

            return (
              <div
                key={p.id}
                className="rounded-2xl bg-charcoal-900/60 border border-charcoal-800/80 p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      <a
                        href={p.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-charcoal-500 hover:text-primary transition-colors"
                        title="Get API Key"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="text-[11px] text-charcoal-400 font-mono">
                      Models: {p.models}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-2">
                    {isConfigured ? (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Active ({source === 'env' ? 'ENV' : 'User Key'})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                        Sandbox Mode (Key Missing)
                      </span>
                    )}
                  </div>
                </div>

                {/* Masked / Input Field */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type={showKey[p.id] ? 'text' : 'password'}
                      value={keysInput[p.id] || (isConfigured && !keysInput[p.id] ? status?.masked : '')}
                      onChange={(e) =>
                        setKeysInput((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder={p.placeholder}
                      className="w-full bg-charcoal-950 px-3.5 py-2 pr-9 rounded-xl border border-charcoal-750 text-xs font-mono text-charcoal-200 placeholder-charcoal-600 focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKey((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                      }
                      className="absolute right-2.5 top-2.5 text-charcoal-500 hover:text-charcoal-300"
                    >
                      {showKey[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleSaveKey(p.id)}
                      disabled={!keysInput[p.id]?.trim()}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        keysInput[p.id]?.trim()
                          ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer shadow-subtle'
                          : 'bg-charcoal-800 text-charcoal-600 cursor-not-allowed'
                      }`}
                    >
                      {saveSuccess[p.id] ? (
                        <span className="flex items-center space-x-1 text-white">
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved</span>
                        </span>
                      ) : (
                        'Save Key'
                      )}
                    </button>

                    <button
                      onClick={() => handleTestConnection(p.id)}
                      disabled={isTesting}
                      className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-charcoal-200 text-xs font-semibold border border-charcoal-700 transition-colors"
                    >
                      {isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Test Feedback Result */}
                {currentTest && (
                  <div
                    className={`mt-2.5 p-2 rounded-lg text-[11px] font-mono leading-relaxed border ${
                      currentTest.success
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                    }`}
                  >
                    {currentTest.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Database Engine Information Card */}
        <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold text-white">
                Database Engine: {providerStatus?.databaseMode || 'Persistent Local Store'}
              </div>
              <div className="text-[11px] text-charcoal-400">
                To switch to PostgreSQL, set <code>DATABASE_URL</code> in your environment variables.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition-colors self-end sm:self-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
