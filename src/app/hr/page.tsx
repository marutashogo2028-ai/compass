"use client";
import { Card, EmptyNote, SectionTitle } from "@/components/ui";
import { contentSuggestion, getMockStudents, hrInsights } from "@/lib/analytics";
import { getCompany } from "@/lib/data";
import { meAsStudent, useEvents, useHrCompany } from "@/lib/store";

export default function HrInsightsPage() {
  const companyId = useHrCompany();
  const events = useEvents();
  const company = getCompany(companyId)!;
  const ins = hrInsights(companyId, [...getMockStudents(), meAsStudent(events)]);
  const maxViews = Math.max(1, ...ins.views.map((v) => v.views));

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">学生インサイト</h1>
        <p className="mt-1 text-sm text-neutral-600">{company.name}の仕事ページを見た学生が、何を知りたがっているか。</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-[11px] text-neutral-500">ページ閲覧</p>
          <p className="text-2xl font-bold">{ins.totalViews}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-neutral-500">閲覧した学生</p>
          <p className="text-2xl font-bold">{ins.uniqueViewers}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-neutral-500">質問</p>
          <p className="text-2xl font-bold">{ins.totalQuestions}</p>
        </Card>
      </div>

      <Card>
        <SectionTitle sub="職種ページごとの閲覧数">仕事ページの閲覧数</SectionTitle>
        <ul className="space-y-2">
          {ins.views.map((v) => (
            <li key={v.job.id} className="text-xs" title={`${v.job.title}：${v.views}回（${v.uniqueStudents}人）`}>
              <div className="flex justify-between">
                <span className="font-medium text-neutral-800">{v.job.title}</span>
                <span className="text-neutral-600">
                  {v.views}回・{v.uniqueStudents}人
                </span>
              </div>
              <span className="mt-1 block h-3 rounded-sm bg-neutral-100">
                {v.views > 0 && <span className="block h-3 rounded-r" style={{ width: `${(v.views / maxViews) * 100}%`, background: "var(--series-1)" }} />}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle sub="学生が仕事Q&Aで聞いた質問">よく聞かれる質問</SectionTitle>
        {ins.topQuestions.length === 0 ? (
          <EmptyNote>まだ質問がありません。</EmptyNote>
        ) : (
          <ul className="divide-y divide-black/5">
            {ins.topQuestions.map((q) => (
              <li key={q.question} className="flex items-center gap-2 py-2 text-sm">
                <span className="flex-1">{q.question}</span>
                {q.status === "no_evidence" ? (
                  <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">⚠ 回答不可</span>
                ) : (
                  <span className="shrink-0 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-900">✓ 回答済</span>
                )}
                <span className="w-8 shrink-0 text-right text-xs text-neutral-600">{q.count}件</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="border-amber-300">
        <SectionTitle sub="根拠となる情報がなく、答えられなかった質問。発信すべきコンテンツの候補です">答えられなかった質問</SectionTitle>
        {ins.unanswered.length === 0 ? (
          <EmptyNote>答えられなかった質問はありません。</EmptyNote>
        ) : (
          <ul className="space-y-2">
            {ins.unanswered.map((q) => (
              <li key={q.question} className="rounded-xl bg-amber-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{q.question}</p>
                  <span className="shrink-0 text-xs text-neutral-600">{q.students.size}人</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-600">
                  分類：{q.category} ／ おすすめの発信：<span className="font-bold text-neutral-800">{contentSuggestion(q.category)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-neutral-500">コンテンツを公開すると、同じ質問に根拠つきで答えられるようになります。</p>
      </Card>
    </>
  );
}
