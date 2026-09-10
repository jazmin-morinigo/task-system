import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { tasksRouter } from './routes/tasks.js';
import { errorHandler } from './lib/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, '..', 'web-dist');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/tasks', tasksRouter);

app.use(express.static(staticDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
