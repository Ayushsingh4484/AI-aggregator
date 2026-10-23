import { AIModelInfo, Conversation, PromptTemplate, ProviderStatus, AnalyticsData, RouteRecommendation } from '../types';

const API_BASE = '/api';

export const api = {
  // Models
  async getModels(): Promise<AIModelInfo[]> {
    const res = await fetch(`${API_BASE}/providers/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
  },

  // Providers & Keys
  async getProviderStatus(): Promise<ProviderStatus> {
    const res = await fetch(`${API_BASE}/providers/status`);
    if (!res.ok) throw new Error('Failed to fetch provider status');
    return res.json();
  },

  async saveProviderKey(provider: string, key: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/providers/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key }),
    });
    if (!res.ok) throw new Error('Failed to save API key');
    return res.json();
  },

  async testProviderConnection(provider: string, keyOverride?: string): Promise<{ success: boolean; message: string; modelCount?: number }> {
    const res = await fetch(`${API_BASE}/providers/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, keyOverride }),
    });
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async createConversation(data: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  // Prompts
  async getPrompts(): Promise<PromptTemplate[]> {
    const res = await fetch(`${API_BASE}/prompts`);
    if (!res.ok) throw new Error('Failed to fetch prompts');
    return res.json();
  },

  async createPrompt(prompt: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const res = await fetch(`${API_BASE}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
    if (!res.ok) throw new Error('Failed to create prompt');
    return res.json();
  },

  async deletePrompt(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/prompts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete prompt');
    return res.json();
  },

  // Router Recommendation
  async getRouteRecommendation(prompt: string, preference?: string): Promise<RouteRecommendation> {
    const res = await fetch(`${API_BASE}/chat/route-recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, preference }),
    });
    if (!res.ok) throw new Error('Failed to get recommendation');
    return res.json();
  },

  // Compare Models
  async compareModels(prompt: string, modelIds: string[], systemPrompt?: string): Promise<{ results: any[] }> {
    const res = await fetch(`${API_BASE}/chat/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, modelIds, systemPrompt }),
    });
    if (!res.ok) throw new Error('Failed to compare models');
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Streaming Chat with abort support
  streamChat(
    params: {
      conversationId?: string;
      modelId: string;
      messages: { role: string; content: string }[];
      systemPrompt?: string;
      userMessageId?: string;
    },
    callbacks: {
      onToken: (token: string) => void;
      onThinking?: (thought: string) => void;
      onDone: (data: any) => void;
      onError: (err: any) => void;
    },
    signal?: AbortSignal
  ) {
    fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        if (!response.body) {
          throw new Error('No readable stream');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

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
                if (event.type === 'token') {
                  callbacks.onToken(event.token);
                } else if (event.type === 'thinking') {
                  callbacks.onThinking?.(event.thought);
                } else if (event.type === 'done') {
                  callbacks.onDone(event);
                } else if (event.type === 'error') {
                  callbacks.onError(new Error(event.error));
                }
              } catch (e) {
                // Ignore chunk parse errors
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user');
        } else {
          callbacks.onError(err);
        }
      });
  }
};
