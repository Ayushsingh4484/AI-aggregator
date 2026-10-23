import { Router } from 'express';
import { db } from '../db/index.js';

export const analyticsRouter = Router();

// GET usage and cost analytics
analyticsRouter.get('/', async (req, res) => {
  try {
    const data = await db.getAnalytics();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
