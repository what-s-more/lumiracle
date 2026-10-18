/**
 * 边缘函数公共类型（T2）
 *
 * 刻意自建最小接口类型而不引入 `@cloudflare/workers-types`：
 * 该包会污染 Next 构建的全局类型检查（本项目 tsconfig 覆盖 `**\/*.ts`），
 * 因此与 `functions/api/health.ts` 保持同一模式。
 */

/** Workers AI 绑定（embedding / 生成） */
export interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

/** Vectorize 命中项 */
export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/** Vectorize 绑定 */
export interface VectorizeBinding {
  query(
    vector: number[],
    options: {
      topK: number;
      returnMetadata?: 'all' | 'indexed' | 'none';
      returnValues?: boolean;
      filter?: Record<string, unknown>;
    },
  ): Promise<{ matches?: VectorizeMatch[]; count?: number }>;
}

/** 问答接口所需的环境绑定 */
export interface ChatEnv {
  AI: AiBinding;
  VECTORIZE: VectorizeBinding;
  /** 生成模型名，可通过 Pages 环境变量覆盖 */
  CHAT_MODEL?: string;
}
