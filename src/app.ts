import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import './types/express.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import rewardRoutes from './routes/reward.routes.js';
import userRoutes from './routes/user.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import gameRoutes from './routes/game.routes.js';
import activityRoutes from './routes/activity.routes.js';
import shopRoutes from './routes/shop.routes.js';
import { swaggerSpec } from './docs/swagger.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';
import { env } from './config/env.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kiddo-backend' });
});

app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/rewards', rewardRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/shop', shopRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
