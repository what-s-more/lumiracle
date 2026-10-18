import { test, expect } from '@playwright/test';

/**
 * 边缘接口 E2E（T7 / M5）
 *
 * 需要真实边缘服务：设置 E2E_BASE_URL（或 E2E_API_BASE 配合本地静态服务器）
 * 指向已部署（或预览）环境；未设置时整组跳过，保证本地/无云资源时 CI 不误报失败。
 */

const hasApi = Boolean(process.env.E2E_BASE_URL || process.env.E2E_API_BASE);

test.describe('RAG 问答与看板（需边缘服务）', () => {
  test.skip(!hasApi, '未设置 E2E_BASE_URL / E2E_API_BASE，跳过 API 断言');

  test('问答返回带可点验引用的回答', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '星辉问询' }).click();
    await page.getByPlaceholder('向书卷提问…').fill('怎么配置 Next.js 静态导出？');
    await page.getByRole('button', { name: '提问' }).click();

    // 引用来源可点验：指向 /posts/... 的 chip
    const source = page.locator('.ask-source-chip').first();
    await expect(source).toBeVisible({ timeout: 30_000 });
    await expect(source).toHaveAttribute('href', /^\/posts\//);

    // 正文有内容（非拒答）
    await expect(page.locator('.ask-caret')).toBeHidden({ timeout: 30_000 });
  });

  test('看板展示真实访问数据', async ({ page }) => {
    await page.goto('/dashboard/');
    await expect(page.getByText('浏览量 PV').first()).toBeVisible({ timeout: 20_000 });
    // 有数据时不应出现空态文案
    await expect(page.getByText('暂无数据，先浏览站内页面后再回来看看')).toBeHidden();
  });
});
