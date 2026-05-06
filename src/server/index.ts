import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from './config';
import { TestRailAdapter } from './testrail/TestRailAdapter';
import { runsRoute } from './routes/runs';
import { metricsRoute } from './routes/metrics';
import { dashboardRoute } from './routes/dashboard';
import { stabilityRoute } from './routes/stability';
import { failuresRoute } from './routes/failures';

const config = loadConfig();
const testrail = new TestRailAdapter({
  baseUrl: config.testrailBaseUrl,
  username: config.testrailUsername,
  password: config.testrailPassword,
});

const app = new Hono();

app.onError((err, c) => {
  console.error(`[${c.req.method} ${c.req.path}]`, err);
  return c.json(
    { error: err instanceof Error ? err.message : 'Internal Server Error' },
    500
  );
});

// API routes
app.route('/api/runs', runsRoute(testrail));
app.route('/api/metrics', metricsRoute(testrail, config.defaultProjectId));
app.route('/api/dashboard', dashboardRoute(testrail, config.defaultProjectId));
app.route('/api/stability', stabilityRoute(testrail, config.defaultProjectId));
app.route('/api/failures', failuresRoute(testrail, config.defaultProjectId));
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Serve built Vite assets in production; in dev, Vite handles its own server
if (!config.isDev) {
  app.use('/assets/*', serveStatic({ root: './dist' }));
  app.get('*', (c) => {
    const html = readFileSync(resolve('./dist/index.html'), 'utf-8');
    return c.html(html);
  });
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Jahia QA server running on http://localhost:${info.port}`);
  if (config.isDev) {
    console.log('  API only — Vite dev server handles the client on :5173');
  }
});
