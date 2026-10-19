import { test, expect } from '@playwright/test';

/**
 * 静态关键路径 E2E（T7 / M5）
 *
 * 仅依赖构建产物 out/，不需要任何边缘服务，因此本地与 CI 均可稳定执行。
 */

test.describe('静态站点关键路径', () => {
  test('首页渲染并列出文章', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByText('Lumiracle')).toBeVisible();
    await expect(page.locator('a[href="/posts/nextjs-static-export/"]').first()).toBeVisible();
  });

  test('首页 → 文章页', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/posts/nextjs-static-export/"]').first().click();
    await expect(page).toHaveURL(/\/posts\/nextjs-static-export\/$/);
    // 页面存在两个 h1（站点标题 + 文章标题），取文章主标题断言
    await expect(page.getByRole('heading', { level: 1 }).last()).toContainText('Next.js 静态导出');
  });

  test('Pagefind 全文搜索命中文章', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '魔法探知' }).click();
    await page.getByPlaceholder('搜索魔法书卷...').fill('Cloudflare');
    // 结果链接由 Pagefind 返回，指向文章 URL
    await expect(page.locator('a[href*="/posts/nextjs-static-export"]').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('文章页含“就本文提问”入口', async ({ page }) => {
    await page.goto('/posts/nextjs-static-export/');
    await expect(page.getByRole('button', { name: '就本文提问' })).toBeVisible();
    await page.getByRole('button', { name: '就本文提问' }).click();
    await expect(page.getByPlaceholder('向书卷提问…')).toBeVisible();
  });

  test('看板页可达并展示标题', async ({ page }) => {
    await page.goto('/dashboard/');
    await expect(page.getByText('阅读数据').first()).toBeVisible();
  });
});
