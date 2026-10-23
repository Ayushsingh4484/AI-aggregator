import { Router } from 'express';
import { db } from '../db/index.js';
import { aiProviderService } from '../services/aiProviders.js';
import { routePrompt } from '../services/aiRouter.js';
import { calculateCost, estimateTokenCount } from '../services/costCalculator.js';

export const chatRouter = Router();

/**
 * Route recommendation endpoint
 */
chatRouter.post('/route-recommend', (req, res) => {
  const { prompt, preference } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  const recommendation = routePrompt(prompt, preference);
  res.json(recommendation);
});

/**
 * Streaming chat endpoint using Server-Sent Events (SSE)
 */
chatRouter.post('/stream', async (req, res) => {
  const { conversationId, modelId, messages, systemPrompt, userMessageId } = req.body;

  if (!modelId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullContent = '';
  let fullThinking = '';

  try {
    await aiProviderService.streamResponse(
      modelId,
      messages,
      systemPrompt,
      {
        onToken: (token: string) => {
          fullContent += token;
          res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
        },
        onThinking: (thought: string) => {
          fullThinking += thought;
          res.write(`data: ${JSON.stringify({ type: 'thinking', thought })}\n\n`);
        },
        onComplete: async (metrics) => {
          // Record usage metrics in DB
          const usageId = 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
          await db.recordUsage({
            id: usageId,
            timestamp: Date.now(),
            modelId,
            provider: modelId.startsWith('claude') ? 'anthropic' : modelId.startsWith('gemini') ? 'google' : modelId.startsWith('groq') ? 'groq' : modelId.startsWith('deepseek') ? 'deepseek' : 'openai',
            inputTokens: metrics.inputTokens,
            outputTokens: metrics.outputTokens,
            costUSD: metrics.costUSD,
            latencyMs: metrics.latencyMs,
            success: true
          });

          // If conversationId is supplied, persist messages
          if (conversationId) {
            const conv = await db.getConversation(conversationId);
            if (conv) {
              const lastUserMsg = messages[messages.length - 1];
              const assistantMsg = {
                id: 'm-' + Date.now() + '-asst',
                role: 'assistant' as const,
                content: fullContent,
                modelId,
                timestamp: Date.now(),
                metrics: {
                  ...metrics,
                  firstTokenMs: Math.min(metrics.latencyMs, 250)
                },
                thinking: fullThinking || undefined
              };

              // Make sure user message is present
              const hasUser = conv.messages.some(m => m.id === userMessageId || (m.role === 'user' && m.content === lastUserMsg.content));
              if (!hasUser && lastUserMsg) {
                conv.messages.push({
                  id: userMessageId || ('m-' + Date.now() + '-usr'),
                  role: 'user',
                  content: lastUserMsg.content,
                  timestamp: Date.now() - metrics.latencyMs
                });
              }

              conv.messages.push(assistantMsg);
              conv.updatedAt = Date.now();
              await db.saveConversation(conv);
            }
          }

          res.write(`data: ${JSON.stringify({ type: 'done', metrics, content: fullContent, thinking: fullThinking })}\n\n`);
          res.end();
        },
        onError: (err) => {
          res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream error' })}\n\n`);
          res.end();
        }
      }
    );
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream failed' })}\n\n`);
    res.end();
  }
});

/**
 * Compare endpoint: run prompt against multiple models in parallel
 */
chatRouter.post('/compare', async (req, res) => {
  const { prompt, modelIds, systemPrompt } = req.body;

  if (!prompt || !modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
    return res.status(400).json({ error: 'Prompt and modelIds array are required' });
  }

  const results = await Promise.all(
    modelIds.map(async (modelId) => {
      let content = '';
      let thinking = '';
      const startTime = Date.now();

      return new Promise((resolve) => {
        aiProviderService.streamResponse(
          modelId,
          [{ role: 'user', content: prompt }],
          systemPrompt,
          {
            onToken: (tok) => { content += tok; },
            onThinking: (th) => { thinking += th; },
            onComplete: async (metrics) => {
              // Log usage
              await db.recordUsage({
                id: 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
                timestamp: Date.now(),
                modelId,
                provider: modelId.startsWith('claude') ? 'anthropic' : modelId.startsWith('gemini') ? 'google' : modelId.startsWith('groq') ? 'groq' : modelId.startsWith('deepseek') ? 'deepseek' : 'openai',
                inputTokens: metrics.inputTokens,
                outputTokens: metrics.outputTokens,
                costUSD: metrics.costUSD,
                latencyMs: metrics.latencyMs,
                success: true
              });

              resolve({
                modelId,
                content,
                thinking: thinking || undefined,
                metrics: {
                  ...metrics,
                  totalTimeMs: Date.now() - startTime
                },
                success: true
              });
            },
            onError: (err) => {
              resolve({
                modelId,
                content: `Error generating response: ${err.message || 'Unknown error'}`,
                metrics: {
                  inputTokens: estimateTokenCount(prompt),
                  outputTokens: 0,
                  costUSD: 0,
                  latencyMs: Date.now() - startTime,
                  isSimulated: false
                },
                success: false,
                error: err.message
              });
            }
          }
        );
      });
    })
  );

  res.json({ results });
});
