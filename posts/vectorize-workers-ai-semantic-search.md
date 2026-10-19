---
title: "Vectorize 与 Workers AI：构建站内语义检索"
date: "2026-02-09"
description: "从文章切块、embedding 到向量查询的完整链路，以及 topK、过滤器和维度对齐这些容易忽略的细节"
category: "Tutorial"
tags: ["vectorize", "workers-ai", "rag", "embedding", "search"]
---

# Vectorize 与 Workers AI：构建站内语义检索

关键词搜索答不了「为什么要这么配置」这类问题，因为它不理解语义。Vectorize 是 Cloudflare 的向量数据库，配合 Workers AI 的 embedding 模型，可以在全边缘环境里跑通语义检索，不需要任何外部向量服务。

## 索引的创建与维度

```bash
npx wrangler vectorize create posts --dimensions=1024 --metric=cosine
```

维度必须与 embedding 模型输出一致：`@cf/baai/bge-m3` 输出 1024 维，索引建多少维就得匹配多少维，错了查询直接报错且无法改——只能删了重建。余弦相似度（cosine）适合文本检索，内积（dot product）适合已有归一化向量的场景，别默认选 euclidean，它在高维文本上表现通常更差。

## 切块比想象中重要

把整篇文章变成一个向量，检索粒度太粗，命中的是文章但回答需要的是段落。合理做法是按标题层级切块，每块 300 到 500 token，并把标题路径拼进正文一起 embedding：

```js
const chunks = chunkMarkdown(body, { slug, title });
// 每块的 text 以「文章标题 › 章节 › 小节」开头，再接正文
```

标题前缀让「什么是 trailingSlash」这类问题能命中「Next.js 静态导出 › 配置 › trailingSlash」这个小节，而不是整篇文章的平均语义。块的 metadata 里要存 slug、标题、锚点和正文——查询时 `returnMetadata: 'all'` 直接拿回上下文，省一次回表。

## 写入与幂等

```js
await env.VECTORIZE.upsert(vectors); // [{ id, values, metadata }]
```

向量 id 用 `slug#anchor` 这类确定性命名，重建索引时先 `deleteByIds` 旧 id 再 upsert，保证脚本可以重复执行而不堆积脏数据。全量重建比增量 diff 简单得多——博客文章数量级下，直接全量是正解。

## 查询链路

```ts
const embedding = await env.AI.run("@cf/baai/bge-m3", { text: [question] });
const result = await env.VECTORIZE.query(embedding.data[0], {
  topK: 5,
  returnMetadata: "all",
  returnValues: false,
});
```

三个参数都有讲究：`topK` 取 5 是召回率与上下文长度的折中，塞太多不相关的块反而稀释答案质量；`returnValues: false` 不回传向量本身，响应体小很多；metadata 过滤支持 `{ slug: { $eq: 'xxx' } }`，做「在本文范围内问答」时先带过滤查一次，空了再退回全站查，两段式比单次全局查询的命中质量高。

## 评测不可省

检索质量不能靠感觉。准备一组「问题 → 应命中的锚点」的标注对，每次改动切块策略或模型后重跑：统计 Recall@5（正确锚点出现在 top5 的比例）和引用正确率。本站 20 条评测集就是这么来的，有数字才有底气说检索是好的。

## 成本

Workers AI 的 embedding 按神经元单位计费，bge-m3 处理一篇几千字的文章不到千分之一神经元；Vectorize 查询免费额度内基本用不完。对个人博客来说，这套组合的实际成本接近零。
