'use client';

/**
 * 阅读数据看板（T5 / M3）
 *
 * 静态导出页，运行时客户端 fetch('/api/stats') 拉取 D1 聚合结果。
 * 图表用 Recharts；配色沿用站内 CSS 变量，不引入新的设计语言。
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { RefreshCw, Loader2 } from 'lucide-react';
import MagicDivider from './MagicDivider';
import { DASHBOARD_LABELS } from '@/lib/site-config';

interface DailyPoint {
  day: string;
  pv: number;
  uv: number;
}
interface ReferrerPoint {
  source: string;
  pv: number;
  uv: number;
}
interface ArticlePoint {
  slug: string;
  pv: number;
  uv: number;
}
interface StatsResponse {
  ok?: boolean;
  error?: string;
  totals: { pv: number; uv: number };
  daily: DailyPoint[];
  referrers: ReferrerPoint[];
  articles: ArticlePoint[];
  updatedAt: string;
}

interface StatsDashboardProps {
  /** slug → 文章标题（构建期从 posts 元数据生成） */
  titles: Record<string, string>;
}

const RANGES = [7, 14, 30] as const;

const AXIS_COLOR = 'var(--muted-foreground)';
const GRID_COLOR = 'var(--border)';
const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--card)',
  border: `1px solid var(--border)`,
  borderRadius: '0.5rem',
  color: 'var(--foreground)',
  fontSize: '0.75rem',
};

export default function StatsDashboard({ titles }: StatsDashboardProps) {
  const [days, setDays] = useState<number>(RANGES[0]);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/stats?days=${range}`, { cache: 'no-store' });
      if (!res.ok) {
        setError('统计数据暂时不可用，请稍后重试。');
        setData(null);
        return;
      }
      setData((await res.json()) as StatsResponse);
    } catch {
      setError('网络异常，未能加载统计数据。');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const hasData = !!data && (data.totals.pv > 0 || data.daily.some((d) => d.pv > 0));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-cormorant)]">
            {DASHBOARD_LABELS.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{DASHBOARD_LABELS.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                days === range
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
              }`}>
              {range} 天
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load(days)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{DASHBOARD_LABELS.refresh}</span>
          </button>
        </div>
      </header>

      <MagicDivider className="my-8" />

      {error && (
        <p className="text-sm text-accent-rose py-6 text-center" role="alert">
          {error}
        </p>
      )}

      {!error && !loading && data && !hasData && (
        <p className="text-sm text-muted-foreground py-12 text-center">{DASHBOARD_LABELS.empty}</p>
      )}

      {!error && data && hasData && (
        <div className="flex flex-col gap-8">
          {/* KPI */}
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="glow-card rounded-2xl bg-card p-5">
              <p className="text-xs text-muted-foreground">{DASHBOARD_LABELS.pv}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{data.totals.pv}</p>
            </div>
            <div className="glow-card rounded-2xl bg-card p-5">
              <p className="text-xs text-muted-foreground">{DASHBOARD_LABELS.uv}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{data.totals.uv}</p>
            </div>
          </div>

          {/* 每日趋势 */}
          <section className="glow-card rounded-2xl bg-card p-5">
            <h2 className="text-sm font-bold text-accent mb-4">{DASHBOARD_LABELS.dailyTitle}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS_COLOR }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: AXIS_COLOR }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="pv" name="PV" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="uv" name="UV" stroke="var(--accent-rose)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* 来源分布 */}
            <section className="glow-card rounded-2xl bg-card p-5">
              <h2 className="text-sm font-bold text-accent mb-4">{DASHBOARD_LABELS.referrerTitle}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.referrers} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="source" tick={{ fontSize: 11, fill: AXIS_COLOR }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: AXIS_COLOR }} />
                    <Bar dataKey="pv" name="PV" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 文章排行 */}
            <section className="glow-card rounded-2xl bg-card p-5">
              <h2 className="text-sm font-bold text-accent mb-4">{DASHBOARD_LABELS.articleTitle}</h2>
              {data.articles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">暂无文章访问</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {data.articles.map((item) => (
                    <li key={item.slug} className="flex items-center justify-between gap-3 py-2.5">
                      <Link href={`/posts/${item.slug}/`}
                        className="text-sm text-foreground hover:text-accent transition-colors truncate">
                        {titles[item.slug] || item.slug}
                      </Link>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        PV {item.pv} · UV {item.uv}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            更新于 {new Date(data.updatedAt).toLocaleString('zh-CN')} · 统计窗口 {days} 天
          </p>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
          ← {DASHBOARD_LABELS.backHome}
        </Link>
      </div>
    </div>
  );
}
