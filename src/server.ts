import http from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_ORIGIN,
    },
  });

  io.on('connection', (socket) => {
    socket.on('family:join', (familyId: string) => {
      socket.join(`family:${familyId}`);
    });
  });

  server.listen(env.PORT, () => {
    console.log(`KidDo backend listening on http://localhost:${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
