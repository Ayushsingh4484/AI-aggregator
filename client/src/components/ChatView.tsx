import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Sparkles,
  Compass,
  Sliders,
  Check,
  X,
  FileText,
  Code2,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Zap
} from 'lucide-react';
import { ChatMessage, AIModelInfo, RouteRecommendation, DEFAULT_MODELS } from '../types';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatViewProps {
  messages: ChatMessage[];
  models: AIModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onSendMessage: (content: string, attachments?: any[], modelOverride?: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  streamingMessage: { content: string; thinking?: string } | null;
  onForkWithModel: (modelId: string, prompt: string) => void;
  onSendToCompare: (prompt: string) => void;
  isAutoRouteEnabled: boolean;
  systemPrompt: string;
  onUpdateSystemPrompt: (prompt: string) => void;
  recommendedRoute: RouteRecommendation | null;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  models,
  selectedModelId,
  onSelectModel,
  onSendMessage,
  isStreaming,
  onStopStreaming,
  streamingMessage,
  onForkWithModel,
  onSendToCompare,
  isAutoRouteEnabled,
  systemPrompt,
  onUpdateSystemPrompt,
  recommendedRoute,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; size: number; dataUrl?: string }>>([]);
  const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState(systemPrompt);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0] || DEFAULT_MODELS[0];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            dataUrl: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const suggestionCards = [
    {
      title: 'Architect a Scalable API',
      prompt: 'Design a resilient TypeScript / Node.js microservice architecture with rate limiting, circuit breakers, and PostgreSQL connection pooling.',
      icon: Code2,
      modelPref: 'claude-3-5-sonnet',
      badge: 'Coding'
    },
    {
      title: 'Deep Research Synthesis',
      prompt: 'Synthesize the state of the art in reasoning models (o1, DeepSeek R1, Gemini 2.0 Flash Thinking). Compare test-time compute vs pre-training.',
      icon: BookOpen,
      modelPref: 'deepseek-reasoner',
      badge: 'Reasoning'
    },
    {
      title: 'C-Suite Executive Briefing',
      prompt: 'Write an executive brief on transitioning our enterprise AI stack to a multi-model aggregator to prevent vendor lock-in and cut token costs by 40%.',
      icon: Lightbulb,
      modelPref: 'gpt-4o',
      badge: 'Strategy'
    },
    {
      title: 'Sub-Second Quick Summary',
      prompt: 'Explain vector embeddings and cosine similarity in 3 concise bullet points for a junior engineer.',
      icon: Zap,
      modelPref: 'groq-llama-3-3-70b',
      badge: 'Ultra Fast'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-charcoal-900/60 overflow-hidden relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 text-center animate-fade-in">
            {/* Minimalist Hero Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>gamoraAI • OmniAI Aggregator</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              All AI Intelligence. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                One Unified Space.
              </span>
            </h2>

            <p className="text-sm md:text-base text-charcoal-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Query, switch, and compare ChatGPT, Claude 3.5 Sonnet, Gemini 1.5 Pro, DeepSeek R1, and Groq without leaving your workspace.
            </p>

            {/* Quick Model Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {models.map((m) => {
                const isSelected = m.id === selectedModelId;
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelectModel(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-charcoal-800 text-white border-primary shadow-subtle ring-1 ring-primary/30'
                        : 'bg-charcoal-950/70 text-charcoal-400 border-charcoal-800 hover:text-charcoal-200 hover:border-charcoal-700'
                    }`}
                  >
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Suggestion Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
              {suggestionCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (card.modelPref) onSelectModel(card.modelPref);
                      onSendMessage(card.prompt);
                    }}
                    className="p-3.5 rounded-2xl bg-charcoal-950/70 hover:bg-charcoal-850/80 border border-charcoal-800/80 hover:border-charcoal-700 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-charcoal-800 text-charcoal-400 border border-charcoal-700">
                          {card.badge}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-charcoal-200 group-hover:text-white mb-1">
                        {card.title}
                      </div>
                      <p className="text-[11px] text-charcoal-400 line-clamp-2 leading-relaxed">
                        {card.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="divide-y divide-charcoal-800/30 pb-4">
            {messages.map((msg, index) => {
              // Find the prompt that triggered this message
              let prevPrompt = '';
              if (msg.role === 'assistant') {
                for (let j = index - 1; j >= 0; j--) {
                  if (messages[j].role === 'user') {
                    prevPrompt = messages[j].content;
                    break;
                  }
                }
              }

              return (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  models={models}
                  onForkWithModel={onForkWithModel}
                  onSendToCompare={onSendToCompare}
                  previousUserPrompt={prevPrompt}
                />
              );
            })}

            {/* Live Streaming Message */}
            {isStreaming && streamingMessage && (
              <ChatMessageItem
                message={{
                  id: 'streaming-msg',
                  role: 'assistant',
                  content: streamingMessage.content || '...',
                  modelId: selectedModelId,
                  timestamp: Date.now(),
                  thinking: streamingMessage.thinking,
                }}
                models={models}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-charcoal-800/80 bg-charcoal-950/90 backdrop-blur-md p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Top Info Bar inside Input Container */}
          <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-charcoal-400">
            {/* Smart Router Recommendation Pill */}
            {isAutoRouteEnabled && recommendedRoute ? (
              <div className="flex items-center space-x-1.5 text-primary">
                <Compass className="w-3.5 h-3.5" />
                <span>
                  Auto-routed to: <strong>{recommendedRoute.modelName}</strong> ({Math.round(recommendedRoute.confidence * 100)}% match)
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Active: <strong>{selectedModel.name}</strong></span>
              </div>
            )}

            {/* System Prompt Customizer Trigger */}
            <button
              onClick={() => {
                setTempSystemPrompt(systemPrompt);
                setShowSystemPromptModal(true);
              }}
              className="hover:text-charcoal-200 transition-colors flex items-center space-x-1"
            >
              <Sliders className="w-3 h-3" />
              <span>{systemPrompt ? 'System Prompt (Active)' : 'Set System Persona'}</span>
            </button>
          </div>

          {/* Attachment Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-200"
                >
                  <FileText className="w-3 h-3 text-primary" />
                  <span className="truncate max-w-[140px]">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="p-0.5 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative rounded-2xl bg-charcoal-900 border border-charcoal-700/80 focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-premium">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedModel.name}... (Enter to send, Shift+Enter for new line)`}
              rows={1}
              className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none resize-none leading-relaxed"
            />

            {/* Bottom Controls inside input box */}
            <div className="absolute left-3 bottom-2.5 right-3 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {/* File Attachment Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
                  title="Attach document, code, or image"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              {/* Send or Stop Button */}
              {isStreaming ? (
                <button
                  onClick={onStopStreaming}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-300" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() && attachments.length === 0}
                  className={`p-2 rounded-xl transition-all ${
                    inputText.trim() || attachments.length > 0
                      ? 'bg-primary hover:bg-primary-dark text-white shadow-glow cursor-pointer'
                      : 'bg-charcoal-800 text-charcoal-600 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Modal */}
      {showSystemPromptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-charcoal-900 border border-charcoal-700 shadow-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-white">System Prompt & Persona</h3>
              </div>
              <button
                onClick={() => setShowSystemPromptModal(false)}
                className="text-charcoal-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-charcoal-400 mb-3">
              Specify instructions, persona, tone, or formatting rules that apply to every response in this conversation.
            </p>
            <textarea
              value={tempSystemPrompt}
              onChange={(e) => setTempSystemPrompt(e.target.value)}
              placeholder="e.g. You are a senior principal engineer. Provide concise code solutions with minimal explanation..."
              rows={4}
              className="w-full p-3 rounded-xl bg-charcoal-950 border border-charcoal-800 text-xs text-charcoal-200 focus:outline-none focus:border-primary resize-none mb-4"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setTempSystemPrompt('');
                  onUpdateSystemPrompt('');
                  setShowSystemPromptModal(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-charcoal-400 hover:text-white hover:bg-charcoal-800"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  onUpdateSystemPrompt(tempSystemPrompt);
                  setShowSystemPromptModal(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-colors"
              >
                Apply Persona
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
