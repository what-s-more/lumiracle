---
title: "GitHub Actions：个人博客的 CI 流水线设计"
date: "2026-03-23"
description: "lint、单测、E2E、构建、部署、索引重建的流水线编排，以及 artifacts 传递、权限最小化和并发控制"
category: "Tutorial"
tags: ["github-actions", "ci", "deployment", "automation"]
---

# GitHub Actions：个人博客的 CI 流水线设计

流水线的价值不在「能跑」，在「挂了的时候能立刻看出是哪一层的问题」。本站的 CI 分六个 job，每个 job 只做一件事，失败原因一眼可见。

## Job 的编排与依赖

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  vitest:
    runs-on: ubuntu-latest
    steps: [...]
  e2e:
    needs: build        # 依赖构建产物
  deploy:
    needs: [vitest, e2e]  # 质量门禁
  index:
    needs: deploy
```

无依赖的 job（lint、vitest、build）并行跑省时间；有依赖的串行。两条铁律：E2E 必须吃构建产物（对 `out/` 目录的断言才是对真实产物的断言），部署必须放在测试之后（没有质量门禁的流水线只是个自动 FTP）。

## Artifacts 传递构建产物

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: site-out
    path: out/
```

build job 产出 `out/`，e2e job 下载它启动静态服务器跑断言，deploy job 下载它推给 Cloudflare Pages。一次构建、三处消费，保证「测过的」和「部署的」是同一份产物——这是很多流水线忽略的一致性问题：测试跑在干净 checkout 上、部署却现场重新构建，两边产物可能不同。

## 权限最小化

```yaml
permissions:
  contents: read
```

workflow 级别收紧到 `contents: read`。部署用的 Cloudflare API token 单独创建，只授 Pages、D1、Vectorize、Workers AI 四项权限，不放账号级 token。泄露爆炸半径取决于 token 权限，这一步的成本是十分钟，收益是睡个安稳觉。

## 条件执行的索引重建

文章是向量索引的数据源，但不是每次提交都动文章。索引重建 job 用路径过滤：

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'posts/**'
      - 'scripts/build-index.mjs'
```

`posts/` 或索引脚本变更才触发，其他提交（改样式、改文档）跳过重建，省时间也省 embedding 费用。

## 并发控制与超时

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

连续 push 时取消排队中的旧 run，只测最新提交。每个 job 设 `timeout-minutes`，防止悬挂的测试把 run 卡到一小时——E2E 尤其需要，浏览器不退出是常态事故。

## 失败通知的最后一块拼图

流水线的闭环是「失败必须被看见」。个人项目用不起 Slack 集成，最简做法是给仓库开邮件通知（默认就有），再加上一条纪律：看到红叉当天处理，不留过夜的红——红叉过夜的仓库，CI 很快就会名存实亡。
