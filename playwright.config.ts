import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 配置（T7 / M5）
 *
 * baseURL 默认指向 scripts/e2e-server.mjs 托管的静态站点（out/）。
 * 若设置 E2E_BASE_URL，则直接对其运行、不再拉起本地 webServer
 * （CI 中可指向云预览域名以启用 API 断言）。
 */
const PORT = Number.parseInt(process.env.E2E_PORT || '4330', 10);
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'node scripts/e2e-server.mjs',
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
