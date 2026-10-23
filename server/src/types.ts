export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'deepseek';

export type ModelCategory = 'coding' | 'reasoning' | 'writing' | 'research' | 'fast' | 'general';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1M: number;  // in USD
  outputCostPer1M: number; // in USD
  speedScore: number;     // 1-10
  intelligenceScore: number; // 1-10
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
    provider?: string;
  };
  attachments?: {
    name: string;
    type: string;
    size: number;
    dataUrl?: string;
  }[];
  thinking?: string; // For reasoning models like o1 / DeepSeek R1
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

export interface ModelComparisonRequest {
  prompt: string;
  modelIds: string[];
  systemPrompt?: string;
  attachments?: any[];
}

export interface RouteRecommendation {
  recommendedModelId: string;
  modelName: string;
  provider: AIProvider;
  category: ModelCategory;
  confidence: number; // 0 to 1
  reasoning: string;
  alternatives: {
    modelId: string;
    modelName: string;
    reason: string;
  }[];
  estimatedTokens: number;
}

export interface UsageMetric {
  id: string;
  timestamp: number;
  modelId: string;
  provider: AIProvider;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  latencyMs: number;
  success: boolean;
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
