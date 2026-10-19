---
title: "SSE 流式传输：边缘函数上的逐字输出"
date: "2026-06-15"
description: "Server-Sent Events 的帧协议、ReadableStream 实现与前端消费，以及在代理链路里保持流式不缓冲的坑"
category: "Tutorial"
tags: ["sse", "streaming", "http", "edge"]
---

# SSE 流式传输：边缘函数上的逐字输出

大模型回答一个字一个字往外蹦，用户看着进度而不是干等——这个体验的核心是 Server-Sent Events（SSE）。它比 WebSocket 简单得多：单向、基于普通 HTTP、不需要额外协议升级。

## 帧协议：就两行格式

SSE 的报文格式简单到离谱：

```
data: {"type":"sources","sources":[...]}

data: {"type":"delta","text":"根据"}

data: [DONE]

```

每帧以 `data:` 开头、空行结尾，服务端往连接里写、浏览器自动派发 `message` 事件。自定义协议时不用管浏览器的事件语义，自己定 JSON 帧类型即可：本站问答流的三种帧是 `sources`（首帧，引用来源）、`delta`（正文增量）、`done`（结束），前端按 `type` 分发渲染。

## 服务端：ReadableStream + 三个响应头

```ts
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
    // ... 生成过程中持续 enqueue
    controller.close();
  },
});
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});
```

`charset=utf-8` 不能省——TextEncoder 输出 UTF-8 字节，缺了这个头中文会乱码。`Cache-Control: no-store` 防止任何一层缓存把流缓存成一次性响应。连接关闭时对已 close 的 controller 再 enqueue 会抛错，用一个 `closed` 标志位守住，这是流式代码最常见的崩溃点。

## 前端消费：fetch 而不是 EventSource

`EventSource` 是浏览器原生 SSE 客户端，但它只支持 GET。问答接口是 POST 带 JSON body，所以用 fetch 加 reader 手动解析：

```ts
const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify(payload) });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';   // 半行留到下一轮
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    handleFrame(JSON.parse(line.slice(5)));
  }
}
```

缓冲区的存在是因为网络分片可能把一帧劈成两半，`lines.pop()` 把残行留给下一轮拼接。`decoder.decode(value, { stream: true })` 的 stream 参数同理——防止多字节 UTF-8 字符被劈开后解码出错。

## 代理链路是缓冲的重灾区

本地好好的，上线后回答「卡一下全出来」——九成是中间某层把流缓冲了。排查顺序：

1. **CDN/代理**：Nginx 默认缓冲上游响应，加 `X-Accel-Buffering: no` 响应头（本站带着这个头的原因）。
2. **HTTP 版本**：HTTP/1.1 需要 `Connection: keep-alive`；某些代理对 HTTP/2 的流式支持更好。
3. **压缩**：gzip 缓冲积累到一定量才输出，流式接口跳过压缩（SSE 本身体积就小）。

## 超时的两面

服务端要设整体时限（检索加生成 25 秒封顶），超时后发一帧 `error` 再关闭，不能让连接悬挂到客户端自己超时。客户端要对「连接建立但无数据」设读超时——正常生成每秒都有增量，超过 10 秒零字节大概率是流断了，直接给用户明确报错比转圈到天荒地老好。

## 备选方案的取舍

WebSocket 适合双向通信，问答场景用不上（只有服务端往客户端推）；分块轮询实现最简单但体验断续；流式 Rendered Response（`Transfer-Encoding: chunked` 纯文本）没法带结构化首帧。SSE 是「单向推送 + 结构化帧 + 普通基础设施」这个约束下的最优解，也是所有大模型对话产品的默认选择。
