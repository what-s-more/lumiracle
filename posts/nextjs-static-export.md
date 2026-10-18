---
title: "Next.js 静态导出部署到 Cloudflare Pages"
date: "2026-05-23"
description: "了解如何配置 Next.js 静态导出并部署到 Cloudflare Pages"
category: "Tutorial"
tags: ["nextjs", "cloudflare-pages", "deployment", "static-export"]
---

# Next.js 静态导出部署到 Cloudflare Pages

了解如何配置 Next.js 生成静态文件并部署到 Cloudflare Pages。

## 配置

在 `next.config.js` 中添加以下配置：

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true
}

module.exports = nextConfig
```

## 关键配置项

### output: 'export'

告诉 Next.js 生成静态站点，而非服务端渲染应用。

### images.unoptimized

静态导出时必须配置此项，禁用图片优化 API。

### trailingSlash: true

为所有 URL 添加尾部斜杠，以更好地兼容静态托管。

## Cloudflare Pages 部署

### 方法一：Dashboard 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages > Create a project
3. 连接你的 GitHub/GitLab 仓库
4. 配置构建设置：
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `out`
5. 点击 Deploy

### 方法二：Wrangler CLI 部署

安装 Wrangler CLI：

```bash
npm install -g wrangler
```

登录 Cloudflare：

```bash
wrangler login
```

部署到 Cloudflare Pages：

```bash
wrangler pages deploy out --project-name <your-project-name>
```

### 方法三：GitHub Actions 工作流

在 `.github/workflows/deploy.yml` 创建工作流文件：

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: <your-project-name>
          directory: out
```

## 构建站点

运行构建命令：

```bash
npm run build
```

静态文件将生成在 `out` 目录中，可以直接部署。

## 环境变量

在 Cloudflare Dashboard 的 Pages 项目设置中添加环境变量：

1. 进入 Pages > 你的项目 > Settings > Environment variables
2. 添加生产环境变量（Production）
3. 对于预览环境，可以添加预览变量（Preview）

## 自定义域名

1. 在 Cloudflare Dashboard 中进入你的域名
2. 添加 CNAME 记录指向 `your-project.pages.dev`
3. 在 Pages 项目设置中配置自定义域名

这样就完成了 Next.js 静态站点到 Cloudflare Pages 的部署！