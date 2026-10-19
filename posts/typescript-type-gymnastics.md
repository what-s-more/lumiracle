---
title: "TypeScript 类型体操入门：从工具类型到模板字面量"
date: "2026-04-20"
description: "Pick、Omit、模板字面量与 infer 的渐进式讲解——类型体操的目的是让编译器替你盯住约定"
category: "Notes"
tags: ["typescript", "types", "generics", "programming"]
---

# TypeScript 类型体操入门：从工具类型到模板字面量

「类型体操」听起来像炫技，但它的实际收益是：把散落在文档和注释里的约定，变成编译期就能检查的约束。这篇从最常用的工具类型讲起，走到模板字面量为止——够用，不过度。

## 工具类型是起点

`Pick<T, K>` 和 `Omit<T, K>` 解决的是「我只要一个大接口的子集」：

```ts
interface Article {
  slug: string; title: string; body: string; draft: boolean; views: number;
}
type ArticleMeta = Pick<Article, 'slug' | 'title'>;   // 列表页只用元信息
type WritableArticle = Omit<Article, 'views'>;         // 写入时视图数只读
```

比手写重复接口好在：Article 改字段时，Pick 出来的类型自动跟随。手写接口会出现「列表页忘了加新字段」这类漂移。

## 模板字面量：字符串类型也有约束

路由、事件名、锚点这类字符串不是任意字符串，模板字面量能把格式写进类型：

```ts
type Route = `/posts/${string}` | '/dashboard' | '/about';
type Anchor = `#${string}`;

function jump(route: Route, anchor?: Anchor) {}
jump('/posts/hello-world', '#配置');   // ok
jump('/archive', '#top');              // ok
jump('posts/hello-world');             // 编译错误：缺前导斜杠
```

本站的引用跳转就受益于这个：来源链接的类型是 `` `/posts/${string}#${string}` ``，拼错格式在编译期就报错，而不是上线后点进 404。

## infer：从类型里"解构"出想要的

`infer` 在条件类型里声明一个待推断的占位符，最常用的是提取返回值和数组元素：

```ts
type Awaited<T> = T extends Promise<infer V> ? V : T;
type Element<T> = T extends (infer E)[] ? E : never;

type R = Awaited<Promise<number[]>>;  // number[]
type E = Element<string[]>;           // string
```

`infer` 的阅读技巧是把 `extends` 读成「如果 T 长这样」：如果 T 是 Promise 包着某个东西，那个东西就叫 V，返回 V。剩下的都是模式匹配的直觉。

## 体操的边界

三个信号说明体操过度了：类型定义比实现还长；同事看不懂泛型参数在干什么；为写类型引入了运行时代码。类型是给人看的约束，不是用来证明聪明的谜题。实用主义的分界线是——类型省掉的那次运行时检查，是否值得多花的那五分钟理解成本。绝大多数业务代码，工具类型加模板字面量就够了，`infer` 偶尔出场，递归条件类型基本不需要。

## 一个实战配方

「确保字符串字面量数组不重复」是检测配置笔误的好帮手：

```ts
type Unique<T extends readonly string[]> =
  T['length'] extends number ? T : never;

const tags = ['nextjs', 'nextjs'] as const;
// 期望编译报错，可以这样写辅助类型实现，此处从简示意
```

完整实现需要递归条件类型，日常用 `satisfies` 加运行时断言的折中方案更务实——类型体操的正确姿势是「八分类型、两分运行时」，全押类型的一方迟早维护不动。
