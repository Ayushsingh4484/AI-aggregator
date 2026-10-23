import { RouteRecommendation, ModelCategory } from '../types.js';
import { SUPPORTED_MODELS, estimateTokenCount } from './costCalculator.js';

export function routePrompt(prompt: string, requestedPreference?: 'speed' | 'quality' | 'cost' | 'auto'): RouteRecommendation {
  const text = prompt.toLowerCase();
  const tokenCount = estimateTokenCount(prompt);

  // Feature detection patterns
  const isCoding = /(```|\bdef\b|\bfunction\b|\bconst\b|\bclass\b|\bimport\b|\bsql\b|\bquery\b|\bselect\b|\bpostgres\b|\bapi\b|\bendpoint\b|\bdebug\b|\berror\b|\bexception\b|\btypescript\b|\bpython\b|\bjavascript\b|\breact\b|\brefactor\b|\bunit test\b)/i.test(prompt);
  const isMathOrLogic = /(\bprove\b|\btheorem\b|\bprobability\b|\bmath\b|\bequation\b|\bcalculate\b|\bcomplexity\b|\bbig-o\b|\blogic puzzle\b|\bstep-by-step reasoning\b|\bgame theory\b|\bquant\b|\bderivative\b|\bintegral\b)/i.test(prompt);
  const isLongContextOrResearch = tokenCount > 3000 || /(\bresearch\b|\bliterature review\b|\bcomprehensive analysis\b|\bsummarize this document\b|\bacademic paper\b|\bstate of the art\b|\bmarket report\b|\bwhitepaper\b|\bcite sources\b)/i.test(prompt);
  const isCreativeWriting = /(\bstory\b|\bnovel\b|\bpoem\b|\bscript\b|\bscreenplay\b|\bmetaphor\b|\bhook\b|\bcopywriting\b|\bpersuasive\b|\bheadline\b|\bcharacter arc\b|\bblog post\b)/i.test(prompt);
  const isFastQuery = tokenCount < 50 && /(\bwhat is\b|\bdefine\b|\btranslate\b|\blist 5\b|\bquick\b|\bsynonym\b|\bconvert\b|\bformula for\b)/i.test(prompt);

  // Honor explicit preference overrides if given
  if (requestedPreference === 'speed') {
    const groq = SUPPORTED_MODELS.find(m => m.id === 'groq-llama-3-3-70b')!;
    return {
      recommendedModelId: groq.id,
      modelName: groq.name,
      provider: groq.provider,
      category: 'fast',
      confidence: 0.95,
      reasoning: 'Routed to Groq Llama 3.3 70B for maximum inference throughput (~300 tokens/sec) and near-zero latency.',
      alternatives: [
        { modelId: 'gemini-2-0-flash', modelName: 'Gemini 2.0 Flash', reason: 'High speed with multimodal reasoning.' },
        { modelId: 'gpt-4o-mini', modelName: 'GPT-4o mini', reason: 'Lightweight OpenAI alternative.' }
      ],
      estimatedTokens: tokenCount
    };
  }

  if (requestedPreference === 'cost') {
    const mini = SUPPORTED_MODELS.find(m => m.id === 'gpt-4o-mini')!;
    return {
      recommendedModelId: mini.id,
      modelName: mini.name,
      provider: mini.provider,
      category: 'fast',
      confidence: 0.93,
      reasoning: 'Prioritizing cost efficiency. GPT-4o mini delivers strong general comprehension at just $0.15 / 1M tokens.',
      alternatives: [
        { modelId: 'gemini-2-0-flash', modelName: 'Gemini 2.0 Flash', reason: 'Even lower cost ($0.10 / 1M) with 1M context window.' },
        { modelId: 'deepseek-reasoner', modelName: 'DeepSeek R1', reason: 'Unbeatable price for rigorous mathematical logic.' }
      ],
      estimatedTokens: tokenCount
    };
  }

  // Intelligence routing logic
  if (isCoding) {
    const sonnet = SUPPORTED_MODELS.find(m => m.id === 'claude-3-5-sonnet')!;
    return {
      recommendedModelId: sonnet.id,
      modelName: sonnet.name,
      provider: sonnet.provider,
      category: 'coding',
      confidence: 0.96,
      reasoning: 'Detected code artifacts and architectural requirements. Claude 3.5 Sonnet benchmark scores highest for code synthesis, refactoring, and bug elimination without hallucinated APIs.',
      alternatives: [
        { modelId: 'gpt-4o', modelName: 'GPT-4o', reason: 'Excellent multi-language syntax and system API knowledge.' },
        { modelId: 'deepseek-reasoner', modelName: 'DeepSeek R1', reason: 'Chain-of-thought verification for tricky edge-cases.' }
      ],
      estimatedTokens: tokenCount
    };
  }

  if (isMathOrLogic) {
    const deepseek = SUPPORTED_MODELS.find(m => m.id === 'deepseek-reasoner')!;
    return {
      recommendedModelId: deepseek.id,
      modelName: deepseek.name,
      provider: deepseek.provider,
      category: 'reasoning',
      confidence: 0.94,
      reasoning: 'Detected mathematical proofs or complex logical deduction. DeepSeek R1 generates an explicit Chain of Thought to eliminate logical leaps and verify answers.',
      alternatives: [
        { modelId: 'claude-3-5-sonnet', modelName: 'Claude 3.5 Sonnet', reason: 'Nuanced logical clarity with direct formatting.' },
        { modelId: 'gemini-1-5-pro', modelName: 'Gemini 1.5 Pro', reason: 'Great for multi-step algorithmic formulations.' }
      ],
      estimatedTokens: tokenCount
    };
  }

  if (isLongContextOrResearch) {
    const gemini = SUPPORTED_MODELS.find(m => m.id === 'gemini-1-5-pro')!;
    return {
      recommendedModelId: gemini.id,
      modelName: gemini.name,
      provider: gemini.provider,
      category: 'research',
      confidence: 0.95,
      reasoning: 'Detected extensive research or high token volume. Gemini 1.5 Pro offers an unmatched 2-Million token context window with flawless needle-in-a-haystack recall.',
      alternatives: [
        { modelId: 'gpt-4o', modelName: 'GPT-4o', reason: 'Crisp executive summaries and citation structure.' },
        { modelId: 'claude-3-5-sonnet', modelName: 'Claude 3.5 Sonnet', reason: 'Superior literary analysis and tone nuance.' }
      ],
      estimatedTokens: tokenCount
    };
  }

  if (isCreativeWriting) {
    const sonnet = SUPPORTED_MODELS.find(m => m.id === 'claude-3-5-sonnet')!;
    return {
      recommendedModelId: sonnet.id,
      modelName: sonnet.name,
      provider: sonnet.provider,
      category: 'writing',
      confidence: 0.92,
      reasoning: 'Detected creative writing or copy generation. Claude 3.5 Sonnet excels at natural human rhythm, avoiding generic AI tropes and corporate fluff.',
      alternatives: [
        { modelId: 'gpt-4o', modelName: 'GPT-4o', reason: 'Strong marketing hook generation and social post drafting.' },
        { modelId: 'groq-llama-3-3-70b', modelName: 'Llama 3.3 70B', reason: 'Fast iterative brainstorming without waiting.' }
      ],
      estimatedTokens: tokenCount
    };
  }

  if (isFastQuery) {
    const groq = SUPPORTED_MODELS.find(m => m.id === 'groq-llama-3-3-70b')!;
    return {
      recommendedModelId: groq.id,
      modelName: groq.name,
      provider: groq.provider,
      category: 'fast',
      confidence: 0.91,
      reasoning: 'Prompt is concise and straightforward. Routing to Groq LPU Llama 3.3 70B for near-instant sub-second response times.',
      alternatives: [
        { modelId: 'gpt-4o-mini', modelName: 'GPT-4o mini', reason: 'Lightweight OpenAI intelligence.' },
        { modelId: 'gemini-2-0-flash', modelName: 'Gemini 2.0 Flash', reason: 'Fast multimodal lookup.' }
      ],
      estimatedTokens: tokenCount
    };
  }

  // Default balanced recommendation: GPT-4o
  const defaultModel = SUPPORTED_MODELS.find(m => m.id === 'gpt-4o')!;
  return {
    recommendedModelId: defaultModel.id,
    modelName: defaultModel.name,
    provider: defaultModel.provider,
    category: 'general',
    confidence: 0.89,
    reasoning: 'Balanced all-rounder recommendation. GPT-4o offers the highest consistency across general knowledge, speed, and instruction following.',
    alternatives: [
      { modelId: 'claude-3-5-sonnet', modelName: 'Claude 3.5 Sonnet', reason: 'If you want deeper prose and better coding nuances.' },
      { modelId: 'gemini-1-5-pro', modelName: 'Gemini 1.5 Pro', reason: 'If you are pasting large documents or reference materials.' }
    ],
    estimatedTokens: tokenCount
  };
}
