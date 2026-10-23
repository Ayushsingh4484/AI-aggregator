import { AIModelInfo } from '../types.js';

export const SUPPORTED_MODELS: AIModelInfo[] = [
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

export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = SUPPORTED_MODELS.find(m => m.id === modelId);
  if (!model) return 0;
  const inCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
  const outCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
  return Number((inCost + outCost).toFixed(6));
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // A standard rule of thumb for English/Code: ~4 chars per token, or word count * 1.3
  return Math.max(1, Math.ceil(text.length / 3.8));
}
