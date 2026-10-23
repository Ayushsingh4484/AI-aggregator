import { Router } from 'express';
import { db } from '../db/index.js';
import { PromptTemplate } from '../types.js';

export const promptRouter = Router();

// GET all prompt templates
promptRouter.get('/', async (req, res) => {
  try {
    const list = await db.getPrompts();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST new prompt
promptRouter.post('/', async (req, res) => {
  try {
    const { title, description, category, prompt, modelRecommendation, tags } = req.body;
    if (!title || !prompt) {
      return res.status(400).json({ error: 'Title and prompt text are required' });
    }
    const newPrompt: PromptTemplate = {
      id: 'p-custom-' + Date.now(),
      title,
      description: description || '',
      category: category || 'general',
      prompt,
      modelRecommendation: modelRecommendation || 'claude-3-5-sonnet',
      tags: tags || []
    };
    const saved = await db.createPrompt(newPrompt);
    res.status(201).json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE prompt
promptRouter.delete('/:id', async (req, res) => {
  try {
    await db.deletePrompt(req.params.id);
    res.json({ success: true, message: 'Prompt deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
