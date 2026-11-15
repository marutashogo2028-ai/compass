"use client";
import Link from "next/link";
import { Card, EmptyNote, SectionTitle } from "@/components/ui";
import { RESOLUTION_STEPS, UNDERSTOOD_THRESHOLD, dashboard } from "@/lib/analytics";
import { jobs } from "@/lib/data";
import { clearEvents, seedDemoEvents, useEvents } from "@/lib/store";
import { QUADRANT_LABEL, type Quadrant } from "@/lib/types";

// 逐次（量）を表す単色ランプ：dataviz リファレンスの青 100→600
const BLUE_RAMP = ["#f0f4fa", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];

export default function DashboardPage() {
  const events = useEvents();
  const d = dashboard(events);
  const maxCat = Math.max(1, ...d.categories.map((c) => c.count));
  const maxQ = Math.max(1, ...Object.values(d.quadrantCounts));
  const topJob = [...d.perJob].sort((a, b) => b.level - a.level)[0];

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">解像度ダッシュボード</h1>
        <EmptyNote>まだ記録がありません。企業マップから仕事ページを見たり、仕事Q&Aで質問したりすると、ここに解像度が貯まっていきます。</EmptyNote>
        <div className="flex gap-2">
          <Link href="/" className="flex-1 rounded-xl bg-teal-700 py-3 text-center text-sm font-bold text-white">
            企業マップへ
          </Link>
          <button onClick={seedDemoEvents} className="flex-1 rounded-xl border border-black/10 bg-white py-3 text-sm">
            サンプル履歴を読み込む
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">解像度ダッシュボード</h1>
        <p className="mt-1 text-sm text-neutral-600">あなたが「仕事の中身」をどこまで具体的に知れたか。</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-[11px] text-neutral-500">理解した職種</p>
          <p className="text-2xl font-bold">
            {d.understood}
            <span className="text-sm font-normal text-neutral-500">/{jobs.length}</span>
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-neutral-500">見た企業</p>
          <p className="text-2xl font-bold">{d.viewedCompanies}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-neutral-500">質問</p>
          <p className="text-2xl font-bold">{d.asked}</p>
          <p className="text-[10px] text-neutral-500">うち根拠なし {d.unanswered}</p>
        </Card>
      </div>

      <Card>
        <SectionTitle sub={`4段階のうち${UNDERSTOOD_THRESHOLD}段階以上で「理解した」とみなします`}>職種ごとの解像度</SectionTitle>
        <ul className="space-y-2.5">
          {d.perJob
            .filter((p) => p.level > 0)
            .sort((a, b) => b.level - a.level)
            .map((p) => (
              <li key={p.job.id}>
                <Link href={`/jobs/${p.job.id}`} className="block">
                  <div className="flex items-baseline justify-between text-sm">
                    <span>
                      <span className="font-medium">{p.job.title}</span>
                      <span className="ml-1 text-xs text-neutral-500">{p.company.name}</span>
                    </span>
                    <span className="text-xs text-neutral-600">{p.level}/4</span>
                  </div>
                  <div className="mt-1 flex gap-0.5" aria-label={`解像度 ${p.level}/4`}>
                    {p.steps.map((done, i) => (
                      <span key={i} title={RESOLUTION_STEPS[i] + (done ? "：済" : "：まだ")} className={`h-2 flex-1 rounded-sm ${done ? "bg-[var(--series-1)]" : "bg-neutral-200"}`} />
                    ))}
                  </div>
                </Link>
              </li>
            ))}
        </ul>
        <p className="mt-3 text-[11px] text-neutral-500">段階：{RESOLUTION_STEPS.join(" → ")}</p>
      </Card>

      <Card>
        <SectionTitle sub="あなたの質問をカテゴリに分けると">質問の傾向</SectionTitle>
        {d.asked === 0 ? (
          <EmptyNote>まだ質問していません。</EmptyNote>
        ) : (
          <ul className="space-y-1.5">
            {d.categories.map((c) => (
              <li key={c.category} className="grid grid-cols-[6.5rem_1fr_1.5rem] items-center gap-2 text-xs" title={`${c.category}：${c.count}件`}>
                <span className="text-neutral-700">{c.category}</span>
                <span className="h-3 rounded-sm bg-neutral-100">
                  {c.count > 0 && <span className="block h-3 rounded-r" style={{ width: `${(c.count / maxCat) * 100}%`, background: "var(--series-1)" }} />}
                </span>
                <span className="text-right text-neutral-600">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle sub="閲覧した企業の象限（色が濃いほど多く見ている）">興味のある象限</SectionTitle>
        <div className="grid grid-cols-[1.2rem_1fr] gap-1">
          <span className="row-span-2 flex items-center justify-center text-[10px] text-neutral-500 [writing-mode:vertical-rl] rotate-180">競争力 →</span>
          <div className="grid grid-cols-2 gap-1">
            {(["HL", "HH", "LL", "LH"] as Quadrant[]).map((q) => {
              const n = d.quadrantCounts[q];
              const step = n === 0 ? 0 : Math.max(1, Math.round((n / maxQ) * (BLUE_RAMP.length - 1)));
              const dark = step >= 4;
              return (
                <div key={q} title={`${QUADRANT_LABEL[q]}：${n}回`} className="rounded-lg p-3" style={{ background: BLUE_RAMP[step] }}>
                  <p className={`text-[11px] ${dark ? "text-white/90" : "text-neutral-600"}`}>{QUADRANT_LABEL[q]}</p>
                  <p className={`text-xl font-bold ${dark ? "text-white" : "text-neutral-900"}`}>{n}</p>
                </div>
              );
            })}
          </div>
          <span className="col-start-2 text-center text-[10px] text-neutral-500">採用人数 →</span>
        </div>
      </Card>

      {topJob && topJob.level > 0 && (
        <Card className="bg-teal-50/60">
          <p className="text-sm">
            次の一歩：いちばん解像度が高い<span className="font-bold">「{topJob.job.title}」</span>について、OB/OGに聞くことを準備しましょう。
          </p>
          <Link href={`/visit/${topJob.job.id}`} className="mt-2 inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white">
            聞くことを準備する
          </Link>
        </Card>
      )}

      <button onClick={clearEvents} className="w-full text-center text-xs text-neutral-400 underline">
        記録をリセット（デモ用）
      </button>
    </div>
  );
}
