import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { Conversation, ChatMessage, PromptTemplate, UsageMetric } from '../types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface LocalStore {
  conversations: Conversation[];
  prompts: PromptTemplate[];
  usageLogs: UsageMetric[];
  providerKeys: Record<string, { masked: string; raw: string; updatedAt: number }>;
}

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'p-code-review',
    title: 'Senior Code Architect Review',
    description: 'Thorough architectural and security code review with performance recommendations.',
    category: 'coding',
    prompt: 'You are a Principal Software Architect. Review the following code for: 1) System design and clean abstractions, 2) Performance bottlenecks and algorithmic efficiency, 3) Edge case handling and defensive programming, 4) Security vulnerabilities. Provide concrete refactored snippets with explanation:\n\n```\n[Insert code here]\n```',
    modelRecommendation: 'claude-3-5-sonnet',
    tags: ['Architecture', 'Refactoring', 'Security']
  },
  {
    id: 'p-algorithm-opt',
    title: 'Algorithm & Complexity Optimizer',
    description: 'Optimize time and space complexity with formal mathematical proof and Big-O breakdown.',
    category: 'coding',
    prompt: 'Analyze the time and space complexity of this algorithm. Identify any nested operations, redundant passes, or memory overhead. Provide a mathematically optimized alternative with Big-O before and after comparison and a clean implementation:\n\n```\n[Code or problem description]\n```',
    modelRecommendation: 'o1-preview',
    tags: ['Algorithms', 'Big-O', 'Optimization']
  },
  {
    id: 'p-exec-summary',
    title: 'C-Suite Executive Briefing',
    description: 'Synthesize complex documents or datasets into an actionable executive brief.',
    category: 'writing',
    prompt: 'Read and synthesize the following material into a high-level C-Suite Executive Briefing. Structure into:\n1. Strategic Context & Objective\n2. Key Findings & Critical Takeaways (bulleted with impact metrics)\n3. Identified Risks & Trade-offs\n4. Recommended Next Steps & Timeline.\n\nMaterial:\n[Insert text or notes here]',
    modelRecommendation: 'gpt-4o',
    tags: ['Executive', 'Strategy', 'Summary']
  },
  {
    id: 'p-deep-research',
    title: 'Deep Research Synthesis',
    description: 'Comprehensive multi-perspective analysis with opposing viewpoints and citations.',
    category: 'research',
    prompt: 'Conduct an in-depth research breakdown on the following topic. Include historical context, current state-of-the-art developments, opposing perspectives/debates, key technical trade-offs, and future trajectories. Write with precision and analytical rigor.\n\nTopic:\n[Insert research topic]',
    modelRecommendation: 'gemini-1-5-pro',
    tags: ['Research', 'Analysis', 'Synthesis']
  },
  {
    id: 'p-creative-brainstorm',
    title: 'Zero-to-One Product Brainstormer',
    description: 'Unconventional product ideas, feature hooks, and distribution strategies.',
    category: 'brainstorming',
    prompt: 'Generate 5 high-impact, non-obvious product angles or features for the following concept. For each angle, specify:\n- The Core Problem it solves\n- The "Magical Moment" for the user\n- Technical feasibility & unfair advantage\n- Viral growth loop or distribution hook\n\nConcept:\n[Describe product/idea]',
    modelRecommendation: 'claude-3-5-sonnet',
    tags: ['Product', 'Innovation', 'Growth']
  },
  {
    id: 'p-sql-query-master',
    title: 'Production SQL & Schema Designer',
    description: 'Design normalized tables, indexes, and write complex performant queries.',
    category: 'coding',
    prompt: 'Design a clean, normalized relational schema and write optimized SQL queries for the following requirements. Include primary keys, foreign keys, constraints, composite indexes for high-throughput queries, and explain EXPLAIN ANALYZE expectations:\n\nRequirements:\n[Specify schema requirements]',
    modelRecommendation: 'gpt-4o',
    tags: ['SQL', 'Databases', 'Backend']
  }
];

class DatabaseManager {
  private pool: Pool | null = null;
  private isPgAvailable = false;
  private store: LocalStore = {
    conversations: [],
    prompts: DEFAULT_PROMPTS,
    usageLogs: [],
    providerKeys: {}
  };

  constructor() {
    this.init();
  }

  private async init() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        this.pool = new Pool({
          connectionString: dbUrl,
          connectionTimeoutMillis: 3000,
        });
        const client = await this.pool.connect();
        client.release();
        this.isPgAvailable = true;
        console.log('[DB] Connected to PostgreSQL successfully.');
        await this.runPgMigrations();
      } catch (err: any) {
        console.warn('[DB] PostgreSQL connection failed. Falling back to local persistent JSON store.', err.message);
        this.isPgAvailable = false;
        this.loadLocalStore();
      }
    } else {
      console.log('[DB] No DATABASE_URL configured. Initializing local persistent store at:', DATA_FILE);
      this.loadLocalStore();
    }
  }

  private loadLocalStore() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.store = {
          conversations: parsed.conversations || [],
          prompts: parsed.prompts?.length ? parsed.prompts : DEFAULT_PROMPTS,
          usageLogs: parsed.usageLogs || [],
          providerKeys: parsed.providerKeys || {}
        };
      } else {
        this.saveLocalStore();
      }
    } catch (e) {
      console.error('[DB] Failed reading local store, resetting to default.', e);
      this.saveLocalStore();
    }
  }

  private saveLocalStore() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed writing local store:', e);
    }
  }

  private async runPgMigrations() {
    if (!this.pool) return;
    try {
      const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'src', 'db', 'schema.sql'), 'utf-8');
      await this.pool.query(schemaSql);
      console.log('[DB] PostgreSQL schema checked and migrated.');
    } catch (e) {
      console.error('[DB] Migration error:', e);
    }
  }

  // --- Conversations ---
  async getConversations(): Promise<Conversation[]> {
    if (this.isPgAvailable && this.pool) {
      try {
        const res = await this.pool.query(`
          SELECT c.*, 
            COALESCE(
              json_agg(
                json_build_object(
                  'id', m.id,
                  'role', m.role,
                  'content', m.content,
                  'modelId', m.model_id,
                  'provider', m.provider,
                  'timestamp', m.timestamp,
                  'metrics', m.metrics,
                  'attachments', m.attachments,
                  'thinking', m.thinking
                ) ORDER BY m.timestamp ASC
              ) FILTER (WHERE m.id IS NOT NULL), '[]'
            ) as messages
          FROM conversations c
          LEFT JOIN messages m ON c.id = m.conversation_id
          GROUP BY c.id
          ORDER BY c.updated_at DESC
        `);
        return res.rows.map(r => ({
          id: r.id,
          title: r.title,
          modelId: r.model_id,
          pinned: r.pinned,
          systemPrompt: r.system_prompt,
          createdAt: Number(r.created_at),
          updatedAt: Number(r.updated_at),
          tags: r.tags || [],
          messages: r.messages || []
        }));
      } catch (e) {
        console.error('[DB] PG getConversations error:', e);
      }
    }
    return this.store.conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    if (this.isPgAvailable && this.pool) {
      try {
        const convRes = await this.pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
        if (convRes.rows.length === 0) return null;
        const msgRes = await this.pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC', [id]);
        const c = convRes.rows[0];
        return {
          id: c.id,
          title: c.title,
          modelId: c.model_id,
          pinned: c.pinned,
          systemPrompt: c.system_prompt,
          createdAt: Number(c.created_at),
          updatedAt: Number(c.updated_at),
          tags: c.tags || [],
          messages: msgRes.rows.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            modelId: m.model_id,
            provider: m.provider,
            timestamp: Number(m.timestamp),
            metrics: m.metrics,
            attachments: m.attachments,
            thinking: m.thinking
          }))
        };
      } catch (e) {
        console.error('[DB] PG getConversation error:', e);
      }
    }
    return this.store.conversations.find(c => c.id === id) || null;
  }

  async saveConversation(conv: Conversation): Promise<Conversation> {
    const existingIndex = this.store.conversations.findIndex(c => c.id === conv.id);
    if (existingIndex >= 0) {
      this.store.conversations[existingIndex] = conv;
    } else {
      this.store.conversations.unshift(conv);
    }
    this.saveLocalStore();

    if (this.isPgAvailable && this.pool) {
      try {
        await this.pool.query(`
          INSERT INTO conversations (id, title, model_id, pinned, system_prompt, created_at, updated_at, tags)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            model_id = EXCLUDED.model_id,
            pinned = EXCLUDED.pinned,
            system_prompt = EXCLUDED.system_prompt,
            updated_at = EXCLUDED.updated_at,
            tags = EXCLUDED.tags
        `, [conv.id, conv.title, conv.modelId, conv.pinned || false, conv.systemPrompt || null, conv.createdAt, conv.updatedAt, JSON.stringify(conv.tags || [])]);

        // Upsert messages
        for (const msg of conv.messages) {
          await this.pool.query(`
            INSERT INTO messages (id, conversation_id, role, content, model_id, provider, timestamp, metrics, attachments, thinking)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
              content = EXCLUDED.content,
              metrics = EXCLUDED.metrics,
              thinking = EXCLUDED.thinking
          `, [msg.id, conv.id, msg.role, msg.content, msg.modelId || null, msg.provider || null, msg.timestamp, JSON.stringify(msg.metrics || {}), JSON.stringify(msg.attachments || []), msg.thinking || null]);
        }
      } catch (e) {
        console.error('[DB] PG saveConversation error:', e);
      }
    }

    return conv;
  }

  async deleteConversation(id: string): Promise<boolean> {
    this.store.conversations = this.store.conversations.filter(c => c.id !== id);
    this.saveLocalStore();

    if (this.isPgAvailable && this.pool) {
      try {
        await this.pool.query('DELETE FROM conversations WHERE id = $1', [id]);
      } catch (e) {
        console.error('[DB] PG deleteConversation error:', e);
      }
    }
    return true;
  }

  // --- Prompts ---
  async getPrompts(): Promise<PromptTemplate[]> {
    return this.store.prompts;
  }

  async createPrompt(p: PromptTemplate): Promise<PromptTemplate> {
    this.store.prompts.unshift(p);
    this.saveLocalStore();
    return p;
  }

  async deletePrompt(id: string): Promise<boolean> {
    this.store.prompts = this.store.prompts.filter(p => p.id !== id);
    this.saveLocalStore();
    return true;
  }

  // --- Analytics & Usage ---
  async recordUsage(metric: UsageMetric): Promise<void> {
    this.store.usageLogs.unshift(metric);
    // keep recent 1000 logs in local store
    if (this.store.usageLogs.length > 1000) {
      this.store.usageLogs = this.store.usageLogs.slice(0, 1000);
    }
    this.saveLocalStore();

    if (this.isPgAvailable && this.pool) {
      try {
        await this.pool.query(`
          INSERT INTO usage_logs (id, timestamp, model_id, provider, input_tokens, output_tokens, cost_usd, latency_ms, success)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [metric.id, metric.timestamp, metric.modelId, metric.provider, metric.inputTokens, metric.outputTokens, metric.costUSD, metric.latencyMs, metric.success]);
      } catch (e) {
        console.error('[DB] PG recordUsage error:', e);
      }
    }
  }

  async getAnalytics() {
    const logs = this.store.usageLogs;
    const totalRequests = logs.length;
    const totalInputTokens = logs.reduce((acc, l) => acc + (l.inputTokens || 0), 0);
    const totalOutputTokens = logs.reduce((acc, l) => acc + (l.outputTokens || 0), 0);
    const totalCostUSD = logs.reduce((acc, l) => acc + (l.costUSD || 0), 0);
    const avgLatency = totalRequests ? Math.round(logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / totalRequests) : 0;

    // By provider breakdown
    const providerStats: Record<string, { requests: number; cost: number; tokens: number }> = {};
    for (const l of logs) {
      if (!providerStats[l.provider]) {
        providerStats[l.provider] = { requests: 0, cost: 0, tokens: 0 };
      }
      providerStats[l.provider].requests += 1;
      providerStats[l.provider].cost += l.costUSD;
      providerStats[l.provider].tokens += (l.inputTokens + l.outputTokens);
    }

    // By model breakdown
    const modelStats: Record<string, { requests: number; cost: number; tokens: number }> = {};
    for (const l of logs) {
      if (!modelStats[l.modelId]) {
        modelStats[l.modelId] = { requests: 0, cost: 0, tokens: 0 };
      }
      modelStats[l.modelId].requests += 1;
      modelStats[l.modelId].cost += l.costUSD;
      modelStats[l.modelId].tokens += (l.inputTokens + l.outputTokens);
    }

    return {
      summary: {
        totalRequests,
        totalInputTokens,
        totalOutputTokens,
        totalCostUSD: Number(totalCostUSD.toFixed(5)),
        avgLatencyMs: avgLatency,
      },
      providerStats,
      modelStats,
      recentLogs: logs.slice(0, 50)
    };
  }

  // --- Provider Keys ---
  setProviderKey(provider: string, rawKey: string) {
    const masked = rawKey.length > 8 
      ? rawKey.slice(0, 4) + '...' + rawKey.slice(-4)
      : '••••••••';
    this.store.providerKeys[provider] = {
      masked,
      raw: rawKey,
      updatedAt: Date.now()
    };
    this.saveLocalStore();
  }

  getProviderKey(provider: string): string | null {
    // Check environment variable first (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY / GOOGLE_API_KEY, GROQ_API_KEY)
    const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    if (envKey) return envKey;
    if (provider === 'google' && process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
    return this.store.providerKeys[provider]?.raw || null;
  }

  getProviderKeyStatuses(): Record<string, { configured: boolean; masked: string; source: 'env' | 'user' | 'none' }> {
    const providers = ['openai', 'anthropic', 'google', 'groq', 'deepseek'];
    const result: Record<string, any> = {};

    for (const p of providers) {
      const envKey = process.env[`${p.toUpperCase()}_API_KEY`] || (p === 'google' ? process.env.GOOGLE_API_KEY : null);
      if (envKey) {
        result[p] = {
          configured: true,
          masked: envKey.slice(0, 4) + '...' + envKey.slice(-4),
          source: 'env'
        };
      } else if (this.store.providerKeys[p]?.raw) {
        result[p] = {
          configured: true,
          masked: this.store.providerKeys[p].masked,
          source: 'user'
        };
      } else {
        result[p] = {
          configured: false,
          masked: '',
          source: 'none'
        };
      }
    }
    return result;
  }

  isUsingPg(): boolean {
    return this.isPgAvailable;
  }
}

export const db = new DatabaseManager();
