/**
 * Server configuration loaded from environment variables.
 * Called once at startup; throws if required vars are missing.
 */
export interface ServerConfig {
  testrailBaseUrl: string;
  testrailUsername: string;
  testrailPassword: string;
  defaultProjectId: number;
  port: number;
  isDev: boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Required environment variable "${name}" is not set. Copy .env.example to .env and fill in the values.`
    );
  }
  return value;
}

export function loadConfig(): ServerConfig {
  return {
    testrailBaseUrl: requireEnv('TESTRAIL_URL').replace(/\/$/, ''),
    testrailUsername: requireEnv('TESTRAIL_USER'),
    testrailPassword: requireEnv('TESTRAIL_PASSWORD'),
    defaultProjectId: parseInt(process.env['TESTRAIL_PROJECT_ID'] ?? '45', 10),
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    isDev: process.env['NODE_ENV'] !== 'production',
  };
}
