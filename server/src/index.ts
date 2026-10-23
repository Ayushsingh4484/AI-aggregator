import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { chatRouter } from './routes/chatRoutes.js';
import { historyRouter } from './routes/historyRoutes.js';
import { promptRouter } from './routes/promptRoutes.js';
import { providerRouter } from './routes/providerRoutes.js';
import { analyticsRouter } from './routes/analyticsRoutes.js';
import { db } from './db/index.js';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'gamoraAI | OmniAI',
    timestamp: Date.now(),
    database: db.isUsingPg() ? 'PostgreSQL' : 'Persistent Local Store'
  });
});

// Mount Routes
app.use('/api/chat', chatRouter);
app.use('/api/conversations', historyRouter);
app.use('/api/prompts', promptRouter);
app.use('/api/providers', providerRouter);
app.use('/api/analytics', analyticsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   gamoraAI | OmniAI Backend                   ║
║         All AI Models in One High-Performance Engine          ║
╠═══════════════════════════════════════════════════════════════╣
║  • Server running on: http://localhost:${PORT}                  ║
║  • Database Engine:   ${db.isUsingPg() ? 'PostgreSQL (Connected)' : 'Local Persistent Store'}        ║
║  • API Health:        http://localhost:${PORT}/api/health       ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
