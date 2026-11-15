"use client";
import { useState } from "react";
import { Card, EmptyNote, formatDate } from "@/components/ui";
import { getMockStudents, highIntentStudents } from "@/lib/analytics";
import { getCompany } from "@/lib/data";
import { meAsStudent, useEvents, useHrCompany } from "@/lib/store";

export default function HighIntentStudentsPage() {
  const companyId = useHrCompany();
  const events = useEvents();
  const [scouted, setScouted] = useState<Set<string>>(new Set());
  const rows = highIntentStudents(companyId, [...getMockStudents(), meAsStudent(events)]);
  const max = Math.max(1, ...rows.map((r) => r.score));

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">訪問意欲の高い学生</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {getCompany(companyId)?.name}の仕事を深く調べている学生（匿名）。個人を特定できる情報は、学生が訪問を依頼するまで表示されません。
        </p>
      </div>

      <p className="text-[11px] text-neutral-500">意欲スコア＝閲覧×1 ＋ 質問×2 ＋ 公開情報で答えられない質問×1 ＋ 訪問準備×3 ＋ 訪問依頼×5</p>

      {rows.length === 0 && <EmptyNote>まだこの企業を調べている学生はいません。</EmptyNote>}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.student.id} className={`p-3 ${r.student.id === "me" ? "ring-2 ring-teal-700/40" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{r.student.anonId}</p>
                <p className="text-[11px] text-neutral-500">
                  {r.student.grade}・{r.student.major}
                  {r.lastActive && ` ・最終 ${formatDate(r.lastActive)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{r.score}</p>
                <p className="text-[10px] text-neutral-500">意欲スコア</p>
              </div>
            </div>
            <span className="mt-2 block h-2 rounded-sm bg-neutral-100">
              <span className="block h-2 rounded-r" style={{ width: `${(r.score / max) * 100}%`, background: "var(--series-1)" }} />
            </span>
            <div className="mt-2 flex flex-wrap gap-1 text-[10.5px] text-neutral-700">
              <span className="rounded bg-neutral-100 px-1.5 py-0.5">閲覧 {r.breakdown.views}</span>
              <span className="rounded bg-neutral-100 px-1.5 py-0.5">質問 {r.breakdown.questions}</span>
              {r.breakdown.deepQuestions > 0 && <span className="rounded bg-amber-100 px-1.5 py-0.5">深い質問 {r.breakdown.deepQuestions}</span>}
              {r.breakdown.visitPrep > 0 && <span className="rounded bg-neutral-100 px-1.5 py-0.5">訪問準備 {r.breakdown.visitPrep}</span>}
              {r.breakdown.requests > 0 && <span className="rounded bg-teal-100 px-1.5 py-0.5 font-bold text-teal-900">訪問依頼 {r.breakdown.requests}</span>}
              {r.student.interests.map((i) => (
                <span key={i} className="rounded border border-black/10 px-1.5 py-0.5">
                  #{i}
                </span>
              ))}
            </div>
            <button
              type="button"
              disabled={scouted.has(r.student.id)}
              onClick={() => setScouted((s) => new Set(s).add(r.student.id))}
              className="mt-2 w-full rounded-lg border border-teal-700 py-1.5 text-xs font-bold text-teal-800 disabled:border-neutral-300 disabled:text-neutral-500"
            >
              {scouted.has(r.student.id) ? "OB/OG訪問の案内を送りました（デモ）" : "OB/OG訪問を案内する"}
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
