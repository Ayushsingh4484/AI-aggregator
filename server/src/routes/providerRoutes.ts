import { Router } from 'express';
import { db } from '../db/index.js';
import { SUPPORTED_MODELS } from '../services/costCalculator.js';
import { aiProviderService } from '../services/aiProviders.js';
import { AIProvider } from '../types.js';

export const providerRouter = Router();

// GET all supported models
providerRouter.get('/models', (req, res) => {
  res.json(SUPPORTED_MODELS);
});

// GET provider connection statuses
providerRouter.get('/status', (req, res) => {
  const statuses = db.getProviderKeyStatuses();
  res.json({
    statuses,
    databaseMode: db.isUsingPg() ? 'PostgreSQL' : 'Persistent Local Store'
  });
});

// POST save a provider key
providerRouter.post('/key', (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) {
    return res.status(400).json({ error: 'Provider and key are required' });
  }

  const validProviders: AIProvider[] = ['openai', 'anthropic', 'google', 'groq', 'deepseek'];
  if (!validProviders.includes(provider as AIProvider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  db.setProviderKey(provider, key.trim());
  res.json({ success: true, message: `Key saved securely for ${provider}` });
});

// POST test connection to a provider
providerRouter.post('/test', async (req, res) => {
  const { provider, keyOverride } = req.body;
  if (!provider) {
    return res.status(400).json({ error: 'Provider is required' });
  }

  const result = await aiProviderService.testProviderConnection(provider as AIProvider, keyOverride);
  res.json(result);
});
