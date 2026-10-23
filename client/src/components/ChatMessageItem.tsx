import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Zap, 
  Clock, 
  Coins, 
  ArrowRightLeft, 
  Layers,
  FileText
} from 'lucide-react';
import { ChatMessage, AIModelInfo } from '../types';
import { CodeBlock } from './CodeBlock';

interface ChatMessageItemProps {
  message: ChatMessage;
  models: AIModelInfo[];
  onForkWithModel?: (modelId: string, originalPrompt: string) => void;
  onSendToCompare?: (prompt: string) => void;
  previousUserPrompt?: string;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  models,
  onForkWithModel,
  onSendToCompare,
  previousUserPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showModelForkMenu, setShowModelForkMenu] = useState(false);

  const isUser = message.role === 'user';
  const modelInfo = models.find((m) => m.id === message.modelId);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const providerColors: Record<string, string> = {
    anthropic: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    openai: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    google: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    groq: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    deepseek: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  };

  return (
    <div
      className={`py-6 px-4 md:px-8 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-charcoal-900/40 border-y border-charcoal-800/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-charcoal-700/80 border border-charcoal-600/50 flex items-center justify-center text-charcoal-200 shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
                modelInfo
                  ? providerColors[modelInfo.provider] || 'text-primary bg-primary/10 border-primary/20'
                  : 'text-primary bg-primary/10 border-primary/20'
              }`}
            >
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          {/* Header Row for Assistant */}
          {!isUser && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-charcoal-100">
                  {modelInfo?.name || message.modelId || 'Assistant'}
                </span>
                {modelInfo?.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-charcoal-800 text-charcoal-300 border border-charcoal-700/60">
                    {modelInfo.badge}
                  </span>
                )}
                {message.metrics?.isSimulated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Sandbox Mode
                  </span>
                )}
              </div>

              {/* Performance Metrics Pills */}
              {message.metrics && (
                <div className="flex items-center space-x-2 text-[11px] text-charcoal-400 font-mono">
                  {message.metrics.latencyMs !== undefined && (
                    <div className="flex items-center space-x-1" title="Generation Latency">
                      <Clock className="w-3 h-3 text-charcoal-500" />
                      <span>{message.metrics.latencyMs}ms</span>
                    </div>
                  )}
                  {message.metrics.outputTokens !== undefined && (
                    <div className="flex items-center space-x-1" title="Tokens generated">
                      <Zap className="w-3 h-3 text-charcoal-500" />
                      <span>{message.metrics.outputTokens} tok</span>
                    </div>
                  )}
                  {message.metrics.estimatedCost !== undefined && (
                    <div className="flex items-center space-x-1 text-emerald-400/90" title="Estimated cost in USD">
                      <Coins className="w-3 h-3" />
                      <span>${message.metrics.estimatedCost.toFixed(5)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Attachments Preview (if present) */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-charcoal-800/80 border border-charcoal-700/60 text-xs text-charcoal-200"
                >
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[180px]">{att.name}</span>
                  <span className="text-[10px] text-charcoal-400">
                    ({Math.round(att.size / 1024)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible Chain of Thought / Reasoning (e.g. DeepSeek R1) */}
          {message.thinking && (
            <div className="mb-4 rounded-xl border border-charcoal-800 bg-charcoal-950/60 overflow-hidden">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Chain of Thought & Reasoning</span>
                </div>
                {showThinking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showThinking && (
                <div className="p-3.5 border-t border-charcoal-800/60 text-xs font-mono text-charcoal-300 leading-relaxed whitespace-pre-wrap bg-charcoal-950/80">
                  {message.thinking}
                </div>
              )}
            </div>
          )}

          {/* Content Body */}
          <div className="prose-custom text-charcoal-100">
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
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Assistant Action Toolbar */}
          {!isUser && (
            <div className="mt-4 pt-3 flex flex-wrap items-center gap-2 border-t border-charcoal-800/40 text-xs text-charcoal-400">
              <button
                onClick={handleCopyMessage}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md hover:bg-charcoal-800 text-charcoal-300 hover:text-white transition-colors"
                title="Copy entire response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Fork with alternative model */}
              {previousUserPrompt && onForkWithModel && (
                <div className="relative">
                  <button
                    onClick={() => setShowModelForkMenu(!showModelForkMenu)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md hover:bg-charcoal-800 text-charcoal-300 hover:text-white transition-colors"
                    title="Run the same prompt with a different AI model"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
                    <span>Try with another AI...</span>
                  </button>

                  {showModelForkMenu && (
                    <div className="absolute left-0 top-full mt-1 w-56 rounded-xl bg-charcoal-900 border border-charcoal-700/80 shadow-elevated p-1.5 z-20">
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase text-charcoal-400 tracking-wider">
                        Re-run prompt with:
                      </div>
                      {models
                        .filter((m) => m.id !== message.modelId)
                        .slice(0, 5)
                        .map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setShowModelForkMenu(false);
                              onForkWithModel(m.id, previousUserPrompt);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-charcoal-800 text-xs text-charcoal-200 flex items-center justify-between"
                          >
                            <span>{m.name}</span>
                            <span className="text-[10px] text-charcoal-500 font-mono">{m.provider}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Send to Compare */}
              {previousUserPrompt && onSendToCompare && (
                <button
                  onClick={() => onSendToCompare(previousUserPrompt)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md hover:bg-charcoal-800 text-charcoal-300 hover:text-white transition-colors"
                  title="Send this prompt to side-by-side comparison"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Send to Compare Arena</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
