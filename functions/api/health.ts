/**
 * 边缘能力冒烟测试（T0 步骤 4）
 *
 * 验证 Workers AI / Vectorize / D1 三个绑定在边缘运行时可用。
 * 用法：npm run build && npx wrangler pages dev out  → 访问 /api/health
 */

interface HealthEnv {
  AI: { run(model: string, input: unknown): Promise<unknown> };
  VECTORIZE: { describe(): Promise<unknown> };
  DB: { prepare(query: string): { first(): Promise<unknown> } };
}

export async function onRequest(context: { env: HealthEnv }): Promise<Response> {
  const { AI, VECTORIZE, DB } = context.env;
  const result: Record<string, string> = {};

  try {
    const out = await AI.run('@cf/baai/bge-m3', { text: ['health check'] });
    const vectors = (out as { data?: unknown[] })?.data;
    result.ai = Array.isArray(vectors) && Array.isArray(vectors[0]) ? `ok (${(vectors[0] as number[]).length}d)` : 'unexpected';
  } catch (err) {
    result.ai = `fail: ${(err as Error).message}`;
  }

  try {
    const info = await VECTORIZE.describe();
    result.vectorize = info ? 'ok' : 'unexpected';
  } catch (err) {
    result.vectorize = `fail: ${(err as Error).message}`;
  }

  try {
    const row = await DB.prepare('SELECT 1 AS ok').first();
    result.d1 = (row as { ok?: number })?.ok === 1 ? 'ok' : 'unexpected';
  } catch (err) {
    result.d1 = `fail: ${(err as Error).message}`;
  }

  const ok = Object.values(result).every((v) => v.startsWith('ok'));
  return Response.json({ ok, ...result }, { status: ok ? 200 : 503 });
}
