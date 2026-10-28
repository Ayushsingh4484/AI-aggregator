export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'deepseek';

export type ModelCategory = 'coding' | 'reasoning' | 'writing' | 'research' | 'fast' | 'general';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  speedScore: number;
  intelligenceScore: number;
  categories: ModelCategory[];
  description: string;
  badge?: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsThinking?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  provider?: AIProvider;
  timestamp: number;
  metrics?: {
    inputTokens?: number;
    outputTokens?: number;
    estimatedCost?: number;
    latencyMs?: number;
    firstTokenMs?: number;
    isSimulated?: boolean;
  };
  attachments?: {
    name: string;
    type: string;
    size: number;
    dataUrl?: string;
  }[];
  thinking?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
  pinned?: boolean;
  systemPrompt?: string;
  messages: ChatMessage[];
  tags?: string[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  modelRecommendation?: string;
  tags: string[];
}

export interface RouteRecommendation {
  recommendedModelId: string;
  modelName: string;
  provider: AIProvider;
  category: ModelCategory;
  confidence: number;
  reasoning: string;
  alternatives: {
    modelId: string;
    modelName: string;
    reason: string;
  }[];
  estimatedTokens: number;
}

export interface ProviderStatus {
  statuses: Record<string, { configured: boolean; masked: string; source: 'env' | 'user' | 'none' }>;
  databaseMode: string;
}

export interface AnalyticsData {
  summary: {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUSD: number;
    avgLatencyMs: number;
  };
  providerStats: Record<string, { requests: number; cost: number; tokens: number }>;
  modelStats: Record<string, { requests: number; cost: number; tokens: number }>;
  recentLogs: Array<{
    id: string;
    timestamp: number;
    modelId: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
    latencyMs: number;
    success: boolean;
  }>;
}

export type ActiveView = 'chat' | 'compare' | 'router' | 'workspaces' | 'prompts' | 'analytics' | 'settings';

export const DEFAULT_MODELS: AIModelInfo[] = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    speedScore: 8.8,
    intelligenceScore: 9.8,
    categories: ['coding', 'writing', 'reasoning', 'general'],
    description: 'Anthropic’s flagship model. Industry-leading code architecture, nuanced reasoning, and natural tone.',
    badge: 'Top for Coding & Writing',
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    speedScore: 9.0,
    intelligenceScore: 9.6,
    categories: ['coding', 'writing', 'research', 'general'],
    description: 'OpenAI’s premier multimodal model. High speed, broad knowledge base, and strong tool use.',
    badge: 'Best All-Rounder',
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    speedScore: 8.2,
    intelligenceScore: 9.5,
    categories: ['research', 'coding', 'reasoning'],
    description: 'Breakthrough 2-million-token context window. Best for massive codebases, audio, video, and lengthy research.',
    badge: '2M Context Monster',
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    contextWindow: 64000,
    maxOutputTokens: 8000,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    speedScore: 7.5,
    intelligenceScore: 9.7,
    categories: ['reasoning', 'coding'],
    description: 'Open-weights reasoning powerhouse with visible Chain of Thought. Matches o1 on math and competition code.',
    badge: 'Deep Reasoning',
    supportsVision: false,
    supportsStreaming: true,
    supportsThinking: true
  },
  {
    id: 'groq-llama-3-3-70b',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    speedScore: 10.0,
    intelligenceScore: 9.0,
    categories: ['fast', 'general', 'writing'],
    description: 'Blistering fast inference powered by Groq LPU (~300 tokens/sec). Instant replies and quick drafting.',
    badge: 'Ultra Fast (300 t/s)',
    supportsVision: false,
    supportsStreaming: true,
    supportsThinking: false
  },
  {
    id: 'gemini-2-0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    speedScore: 9.8,
    intelligenceScore: 9.2,
    categories: ['fast', 'research', 'general'],
    description: 'Next-gen multimodal flash speed with 1M context. Exceptional price-to-performance ratio.',
    badge: 'Ultra-Value 1M',
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false
  },
  {
    id: 'gemini-3-5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    speedScore: 9.9,
    intelligenceScore: 9.5,
    categories: ['fast', 'coding', 'research', 'general'],
    description: 'Google’s next-gen high-speed multimodal reasoning model with 1M context window. Fast inference and deep intelligence.',
    badge: 'State of the Art',
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    speedScore: 9.6,
    intelligenceScore: 8.7,
    categories: ['fast', 'general'],
    description: 'Fast, lightweight model for high-frequency queries, simple summaries, and cost-sensitive tasks.',
    badge: 'Economical',
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    speedScore: 9.5,
    intelligenceScore: 8.9,
    categories: ['fast', 'coding', 'writing'],
    description: 'Rapid responses with near-Sonnet intelligence on coding and formatting tasks.',
    badge: 'Fast & Clever',
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false
  }
];
