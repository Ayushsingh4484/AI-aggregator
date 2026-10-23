import { Router } from 'express';
import { db } from '../db/index.js';
import { Conversation } from '../types.js';

export const historyRouter = Router();

// GET all conversations
historyRouter.get('/', async (req, res) => {
  try {
    const list = await db.getConversations();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET single conversation
historyRouter.get('/:id', async (req, res) => {
  try {
    const conv = await db.getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST create conversation
historyRouter.post('/', async (req, res) => {
  try {
    const { title, modelId, systemPrompt, tags } = req.body;
    const newConv: Conversation = {
      id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: title || 'New Conversation',
      modelId: modelId || 'claude-3-5-sonnet',
      pinned: false,
      systemPrompt: systemPrompt || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: tags || [],
      messages: []
    };
    const saved = await db.saveConversation(newConv);
    res.status(201).json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update conversation (title, pinned, tags, etc.)
historyRouter.put('/:id', async (req, res) => {
  try {
    const existing = await db.getConversation(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const { title, pinned, modelId, systemPrompt, tags } = req.body;
    if (title !== undefined) existing.title = title;
    if (pinned !== undefined) existing.pinned = pinned;
    if (modelId !== undefined) existing.modelId = modelId;
    if (systemPrompt !== undefined) existing.systemPrompt = systemPrompt;
    if (tags !== undefined) existing.tags = tags;
    existing.updatedAt = Date.now();

    const saved = await db.saveConversation(existing);
    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE conversation
historyRouter.delete('/:id', async (req, res) => {
  try {
    await db.deleteConversation(req.params.id);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
