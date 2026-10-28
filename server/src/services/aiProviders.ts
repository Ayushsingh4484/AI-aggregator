import { AIProvider, ChatMessage } from '../types.js';
import { db } from '../db/index.js';
import { SUPPORTED_MODELS, calculateCost, estimateTokenCount } from './costCalculator.js';

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onThinking?: (thought: string) => void;
  onComplete: (metrics: {
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
    latencyMs: number;
    isSimulated: boolean;
  }) => void;
  onError: (err: any) => void;
}

export class AIProviderService {
  /**
   * Check connection status of a provider
   */
  async testProviderConnection(provider: AIProvider, keyOverride?: string): Promise<{ success: boolean; message: string; modelCount?: number }> {
    const apiKey = keyOverride || db.getProviderKey(provider);
    if (!apiKey) {
      return {
        success: false,
        message: `No API key configured for ${provider.toUpperCase()}. Please configure it in Settings or via environment variables.`
      };
    }

    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, message: err.error?.message || `OpenAI returned HTTP ${res.status}` };
        }
        const data = await res.json();
        return { success: true, message: 'Connected successfully to OpenAI API.', modelCount: data.data?.length };
      }

      if (provider === 'anthropic') {
        // Test with a lightweight ping or 1-token message
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }]
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, message: err.error?.message || `Anthropic returned HTTP ${res.status}` };
        }
        return { success: true, message: 'Connected successfully to Anthropic Claude API.' };
      }

      if (provider === 'google') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, message: err.error?.message || `Google API returned HTTP ${res.status}` };
        }
        const data = await res.json();
        return { success: true, message: 'Connected successfully to Google Gemini API.', modelCount: data.models?.length };
      }

      if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, message: err.error?.message || `Groq returned HTTP ${res.status}` };
        }
        const data = await res.json();
        return { success: true, message: 'Connected successfully to Groq Cloud API.', modelCount: data.data?.length };
      }

      if (provider === 'deepseek') {
        const res = await fetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, message: err.error?.message || `DeepSeek returned HTTP ${res.status}` };
        }
        return { success: true, message: 'Connected successfully to DeepSeek API.' };
      }

      return { success: false, message: 'Unsupported provider.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection test failed.' };
    }
  }

  /**
   * Stream response from an AI model
   */
  async streamResponse(
    modelId: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    systemPrompt?: string,
    callbacks?: StreamCallbacks
  ) {
    const startTime = Date.now();
    const modelInfo = SUPPORTED_MODELS.find(m => m.id === modelId) || SUPPORTED_MODELS[0];
    const apiKey = db.getProviderKey(modelInfo.provider);

    const inputTokens = messages.reduce((acc, m) => acc + estimateTokenCount(m.content), 0) + estimateTokenCount(systemPrompt || '');

    // If API key is available, execute real API call
    if (apiKey) {
      try {
        await this.executeRealStream(modelInfo, apiKey, messages, systemPrompt, callbacks, startTime, inputTokens);
        return;
      } catch (err: any) {
        console.error(`[API Call Error: ${modelInfo.provider}]`, err);
        // Inform user about the exact API error, then fall back to simulated sandbox with explanation
        callbacks?.onToken(`\n\n> ⚠️ **Live API Error (${modelInfo.provider.toUpperCase()})**: ${err.message || 'Rate limit or authentication failure'}.\n> Switching to OmniAI local simulation engine...\n\n`);
      }
    }

    // Fallback: Smart Sandbox Mode (clearly communicates that API key is required for live production calls)
    await this.executeSandboxStream(modelInfo, messages, systemPrompt, callbacks, startTime, inputTokens, !apiKey);
  }

  /**
   * Real provider streaming implementation
   */
  private async executeRealStream(
    modelInfo: any,
    apiKey: string,
    messages: any[],
    systemPrompt: string | undefined,
    callbacks: StreamCallbacks | undefined,
    startTime: number,
    inputTokens: number
  ) {
    // OpenAI & Groq & DeepSeek (OpenAI compatible)
    if (modelInfo.provider === 'openai' || modelInfo.provider === 'groq' || modelInfo.provider === 'deepseek') {
      const baseUrl = modelInfo.provider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : modelInfo.provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.deepseek.com/chat/completions';

      const actualModelName = modelInfo.id === 'groq-llama-3-3-70b'
        ? 'llama-3.3-70b-versatile'
        : modelInfo.id === 'deepseek-reasoner'
          ? 'deepseek-reasoner'
          : modelInfo.id;

      const formattedMessages = [];
      if (systemPrompt) {
        formattedMessages.push({ role: 'system', content: systemPrompt });
      }
      formattedMessages.push(...messages);

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: actualModelName,
          messages: formattedMessages,
          stream: true,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      if (!res.body) throw new Error('No response body for streaming');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let outputText = '';
      let thoughtText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.reasoning_content) {
                thoughtText += delta.reasoning_content;
                callbacks?.onThinking?.(delta.reasoning_content);
              }
              if (delta?.content) {
                outputText += delta.content;
                callbacks?.onToken(delta.content);
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }

      const outputTokens = estimateTokenCount(outputText);
      const latencyMs = Date.now() - startTime;
      const costUSD = calculateCost(modelInfo.id, inputTokens, outputTokens);

      callbacks?.onComplete({
        inputTokens,
        outputTokens,
        costUSD,
        latencyMs,
        isSimulated: false
      });
      return;
    }

    // Anthropic Claude
    if (modelInfo.provider === 'anthropic') {
      const actualModel = modelInfo.id === 'claude-3-5-sonnet'
        ? 'claude-3-5-sonnet-20241022'
        : 'claude-3-5-haiku-20241022';

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: actualModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages.filter(m => m.role !== 'system'),
          stream: true
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let outputText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event = JSON.parse(trimmed.slice(6));
              if (event.type === 'content_block_delta' && event.delta?.text) {
                outputText += event.delta.text;
                callbacks?.onToken(event.delta.text);
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }

      const outputTokens = estimateTokenCount(outputText);
      const latencyMs = Date.now() - startTime;
      const costUSD = calculateCost(modelInfo.id, inputTokens, outputTokens);

      callbacks?.onComplete({
        inputTokens,
        outputTokens,
        costUSD,
        latencyMs,
        isSimulated: false
      });
      return;
    }

    // Google Gemini
    if (modelInfo.provider === 'google') {
      let geminiModel = 'gemini-3.5-flash';
      if (modelInfo.id === 'gemini-3-1-flash-lite' || modelInfo.id.includes('flash-lite')) {
        geminiModel = 'gemini-3.1-flash-lite';
      } else if (modelInfo.id.includes('preview')) {
        geminiModel = 'gemini-3-flash-preview';
      } else {
        geminiModel = 'gemini-3.5-flash';
      }

      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
          })
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        let message = `HTTP ${res.status}: ${errorText}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error?.message) message = parsed.error.message;
        } catch (_) {}
        throw new Error(message);
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let outputText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const parts = data.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.text) {
                  outputText += part.text;
                  callbacks?.onToken(part.text);
                }
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }

      const outputTokens = estimateTokenCount(outputText);
      const latencyMs = Date.now() - startTime;
      const costUSD = calculateCost(modelInfo.id, inputTokens, outputTokens);

      callbacks?.onComplete({
        inputTokens,
        outputTokens,
        costUSD,
        latencyMs,
        isSimulated: false
      });
      return;
    }

    throw new Error('Unsupported provider for real execution');
  }

  /**
   * High-fidelity, model-specific sandbox simulation
   * Gives users an instant, realistic preview of each model's distinct persona, formatting, speed, and reasoning
   */
  private async executeSandboxStream(
    modelInfo: any,
    messages: any[],
    systemPrompt: string | undefined,
    callbacks: StreamCallbacks | undefined,
    startTime: number,
    inputTokens: number,
    isKeyMissing: boolean
  ) {
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
    const isCode = /(code|function|typescript|react|python|sql|algorithm|bug|fix|api|design)/i.test(lastUserMsg);
    const isCompare = /(compare|difference|versus|vs|pros and cons)/i.test(lastUserMsg);

    // Initial key warning banner if key missing
    if (isKeyMissing) {
      const banner = `> ℹ️ **Sandbox Mode**: No live API key configured for **${modelInfo.name} (${modelInfo.provider.toUpperCase()})**. Add your key in **Settings > API Keys** for direct provider access.\n\n`;
      callbacks?.onToken(banner);
      await new Promise(r => setTimeout(r, 120));
    }

    // Reasoning Chain of Thought for models that support it
    if (modelInfo.supportsThinking) {
      const thoughts = [
        `Analyzing the query: "${lastUserMsg.slice(0, 60)}..."`,
        `Deconstructing core constraints and edge cases...`,
        `Structuring formal logic and verifying assumptions...`,
        `Formulating rigorous, step-by-step mathematical/computational explanation.`
      ];
      for (const t of thoughts) {
        callbacks?.onThinking?.(`• ${t}\n`);
        await new Promise(r => setTimeout(r, 200));
      }
      callbacks?.onThinking?.('\nReasoning verified. Generating optimal synthesis.\n');
    }

    // Persona-tailored responses
    let generatedChunks: string[] = [];

    if (modelInfo.provider === 'anthropic') {
      if (isCode) {
        generatedChunks = [
          `Here is a clean, architectural solution adhering to SOLID principles and modern TypeScript standards:\n\n`,
          `### 1. Implementation Overview\n\n`,
          `We separate concerns by creating a dedicated handler and typed interfaces. This avoids leaking internal state while keeping the API composable.\n\n`,
          `\`\`\`typescript\n`,
          `interface ConfigOptions {\n`,
          `  timeoutMs: number;\n`,
          `  retries: number;\n`,
          `  enableCaching?: boolean;\n`,
          `}\n\n`,
          `export class UnifiedPipeline<TInput, TOutput> {\n`,
          `  constructor(private readonly config: ConfigOptions) {}\n\n`,
          `  async execute(input: TInput, processor: (data: TInput) => Promise<TOutput>): Promise<TOutput> {\n`,
          `    let attempt = 0;\n`,
          `    while (attempt < this.config.retries) {\n`,
          `      try {\n`,
          `        const result = await Promise.race([\n`,
          `          processor(input),\n`,
          `          new Promise<never>((_, reject) => \n`,
          `            setTimeout(() => reject(new Error('Operation timed out')), this.config.timeoutMs)\n`,
          `          )\n`,
          `        ]);\n`,
          `        return result;\n`,
          `      } catch (err) {\n`,
          `        attempt++;\n`,
          `        if (attempt >= this.config.retries) throw err;\n`,
          `        await new Promise(res => setTimeout(res, 2 ** attempt * 100)); // Exponential backoff\n`,
          `      }\n`,
          `    }\n`,
          `    throw new Error('Pipeline execution exhausted retries.');\n`,
          `  }\n`,
          `}\n`,
          `\`\`\`\n\n`,
          `### 2. Key Architecture Benefits\n`,
          `- **Defensive Retries**: Includes exponential backoff to handle transient network hiccups without overwhelming downstream services.\n`,
          `- **Strict Typing**: Type parameters \`TInput\` and \`TOutput\` provide complete compiler-enforced safety without \`any\` assertions.\n`,
          `- **Non-blocking Execution**: Uses native promise racing for timeout termination.\n`
        ];
      } else {
        generatedChunks = [
          `To approach **${lastUserMsg.trim().slice(0, 50)}**, here is a structured synthesis balancing practical execution with nuanced trade-offs:\n\n`,
          `### Executive Context\n`,
          `When synthesizing strategies across multiple AI platforms, the priority is clarity of objectives, deterministic fallbacks, and cost efficiency.\n\n`,
          `### Key Dimensions\n\n`,
          `1. **System Consistency**: Ensuring uniform message schemas regardless of whether the backend forwards requests to Claude, GPT-4o, or Gemini.\n`,
          `2. **Latency vs Quality**: Routing high-urgency or simple lookups to low-latency models like Groq Llama 3.3, while reserving Claude 3.5 Sonnet for intricate architecture.\n`,
          `3. **Cost Optimization**: Multi-tier token budgeting prevents runaways on large documents.\n\n`,
          `> *Note: For production workloads, configure your API keys in Settings to unlock real-time Anthropic Claude streaming.*`
        ];
      }
    } else if (modelInfo.provider === 'openai') {
      generatedChunks = [
        `Here is an actionable, high-level breakdown addressing **"${lastUserMsg.trim().slice(0, 45)}"**:\n\n`,
        `### Key Highlights\n`,
        `- **High-Performance Architecture**: Fast response times with comprehensive domain coverage.\n`,
        `- **Tool & Function Calling**: Seamless integration with external REST APIs and structured JSON outputs.\n`,
        `- **Multimodal Capabilities**: Native support for image analysis and structured document extraction.\n\n`,
        `### Recommendation\n`,
        `\`\`\`json\n`,
        `{\n`,
        `  "status": "success",\n`,
        `  "provider": "OpenAI",\n`,
        `  "model": "${modelInfo.name}",\n`,
        `  "routingTier": "production-grade",\n`,
        `  "optimalUseCases": ["General Assistant", "Complex Reasoning", "Multilingual Support"]\n`,
        `}\n`,
        `\`\`\`\n\n`,
        `Feel free to test further or configure your \`OPENAI_API_KEY\` in Settings to query the live API!`
      ];
    } else if (modelInfo.provider === 'google') {
      generatedChunks = [
        `### Gemini 1.5 Pro Analysis\n\n`,
        `Leveraging **Gemini's 2,000,000 token context window**, we can ingest entire libraries, multi-thousand-line repositories, and full-length documents in a single prompt.\n\n`,
        `| Capability | Gemini 1.5 Pro | Industry Baseline |\n`,
        `| :--- | :--- | :--- |\n`,
        `| **Context Window** | **2,000,000 tokens** | 128,000 tokens |\n`,
        `| **Multimodal Recall** | Video, Audio, Code, Text | Text & Images only |\n`,
        `| **Inference Cost** | $1.25 / 1M Input | $2.50 - $3.00 / 1M |\n\n`,
        `For the prompt *"${lastUserMsg.trim().slice(0, 40)}"*, Gemini processes cross-document relationships without chunking or vector loss.`
      ];
    } else if (modelInfo.provider === 'groq') {
      generatedChunks = [
        `⚡ **Groq LPU Instant Result (~300 tokens/sec)**\n\n`,
        `Here is the immediate response for: *${lastUserMsg.trim()}*\n\n`,
        `1. **Ultra Low Latency**: Processed at hardware speed on Groq's Tensor Streaming Processing units.\n`,
        `2. **Llama 3.3 70B**: Meta's premier open weights model delivering top-tier performance for conversational and summarization tasks.\n`,
        `3. **Cost Effectiveness**: Highly economical pricing at under $0.80 per 1M output tokens.\n\n`,
        `Done in ~180 milliseconds.`
      ];
    } else {
      generatedChunks = [
        `### DeepSeek R1 Analysis\n\n`,
        `The prompt *"${lastUserMsg.trim().slice(0, 40)}"* has been decomposed into fundamental axioms.\n\n`,
        `- **Mathematical Rigor**: Mathematical and computational steps have been cross-checked.\n`,
        `- **Algorithmic Correctness**: No logical leaps; edge conditions accounted for.\n`,
        `- **Open Innovation**: Matches proprietary reasoning frontiers with transparent open weights.`
      ];
    }

    // Stream out chunks with realistic typing speed based on model speedScore
    const delayPerChunk = Math.max(20, Math.floor(100 / (modelInfo.speedScore || 5)));
    let fullOutput = '';

    for (const chunk of generatedChunks) {
      // Split into smaller word tokens for smooth streaming
      const tokens = chunk.match(/.{1,12}/g) || [chunk];
      for (const tok of tokens) {
        callbacks?.onToken(tok);
        fullOutput += tok;
        await new Promise(r => setTimeout(r, delayPerChunk));
      }
    }

    const outputTokens = estimateTokenCount(fullOutput);
    const latencyMs = Date.now() - startTime;
    const costUSD = calculateCost(modelInfo.id, inputTokens, outputTokens);

    callbacks?.onComplete({
      inputTokens,
      outputTokens,
      costUSD,
      latencyMs,
      isSimulated: true
    });
  }
}

export const aiProviderService = new AIProviderService();
