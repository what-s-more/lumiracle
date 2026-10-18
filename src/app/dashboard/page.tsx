/**
 * 阅读数据看板页（T5 / M3）
 *
 * 服务端组件在构建期读取文章元数据，生成 slug → 标题映射传给客户端图表组件，
 * 使排行榜能显示真实标题（看板本身仍是静态导出页，运行时仅拉取 /api/stats）。
 */

import type { Metadata } from 'next';
import { getSortedPostsData } from '@/lib/posts';
import StatsDashboard from '@/components/StatsDashboard';
import { DASHBOARD_LABELS } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${DASHBOARD_LABELS.title} - Lumiracle`,
  description: DASHBOARD_LABELS.subtitle,
};

export default function DashboardPage() {
  const titles: Record<string, string> = {};
  for (const post of getSortedPostsData()) {
    titles[post.slug] = post.title;
  }

  return (
    <div className="relative z-10">
      <StatsDashboard titles={titles} />
    </div>
  );
}
