"use client";
// チャット右側：相談内容に合わせた OB/OG の具体的な提案（理由・聞くとよい質問・訪問依頼）
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudentProfile } from "@/lib/agent/types";
import { getCompany, getJob } from "@/lib/data";
import type { AlumniRecommendation } from "@/lib/qa/types";
import { logEvent, useEvents } from "@/lib/store";
import { TOPIC_LABEL } from "@/lib/qa/dictionary";

const STAGE_LABEL = { research: "業界研究中", visit: "OB/OG訪問をしたい", selection: "選考が近い" } as const;

export function AlumniPanel({ profile, citedSourceIds }: { profile: StudentProfile; citedSourceIds: string[] }) {
  const events = useEvents();
  const [recs, setRecs] = useState<AlumniRecommendation[] | null>(null);
  const ready = profile.jobIds.length > 0 || citedSourceIds.length > 0;

  // 推薦に効く情報が変わったときだけ再計算する
  const askKey = events
    .filter((e) => e.type === "ask")
    .map((e) => (e.type === "ask" ? `${e.question}:${e.status}` : ""))
    .join("|");
  const key = JSON.stringify([profile.jobIds, profile.coveredTopics, citedSourceIds, askKey]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetch("/api/recommend-alumni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobIds: profile.jobIds, focusTopics: profile.coveredTopics, citedSourceIds, events }),
    })
      .then((r) => (r.ok ? r.json() : { recommendations: [] }))
      .then((d: { recommendations: AlumniRecommendation[] }) => !cancelled && setRecs(d.recommendations))
      .catch(() => !cancelled && setRecs([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  return (
    <aside className="flex min-h-0 flex-col border-l border-black/5 bg-white">
      <div className="border-b border-black/5 px-5 py-3">
        <h2 className="font-bold">あなたへのOB/OG提案</h2>
        <p className="text-xs text-neutral-500">相談の内容に合わせて更新されます</p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* 相談メモ */}
        <div className="rounded-xl bg-neutral-50 p-3 text-xs">
          <p className="mb-1.5 font-bold text-neutral-700">相談メモ</p>
          <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1">
            <dt className="text-neutral-500">興味</dt>
            <dd>{profile.jobIds.length === 1 ? getJob(profile.jobIds[0])?.title : (profile.interestLabel ?? "—")}</dd>
            <dt className="text-neutral-500">状況</dt>
            <dd>{profile.stage ? STAGE_LABEL[profile.stage] : "—"}</dd>
            <dt className="text-neutral-500">見たこと</dt>
            <dd>{profile.coveredTopics.length ? profile.coveredTopics.map((t) => TOPIC_LABEL[t]).join("・") : "—"}</dd>
          </dl>
        </div>

        {!ready && <p className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">左のチャットで質問に答えていくと、話を聞くとよい人を、理由と質問つきでここに提案します。</p>}
        {ready && !recs && <p className="text-sm text-neutral-500">候補を探しています…</p>}

        {ready &&
          recs?.map((r, i) => {
            const requested = events.some((e) => e.type === "visit_request" && e.alumniId === r.alumni.id);
            return (
              <article key={r.alumni.id} className="animate-fade-up rounded-2xl border border-black/10 p-4">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-100 text-lg font-bold text-teal-900">
                    {r.alumni.displayName.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {i === 0 && <span className="mr-1.5 rounded bg-teal-700 px-1.5 py-0.5 text-[10px] text-white">いちばんおすすめ</span>}
                      {r.alumni.displayName}
                      <span className="ml-1 text-xs font-normal text-neutral-500">{r.alumni.joinYear}年入社</span>
                    </p>
                    <p className="truncate text-xs text-neutral-600">
                      {getCompany(r.alumni.companyId)?.name}／{getJob(r.alumni.jobId)?.title}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-600">{r.alumni.oneLiner}</p>

                <p className="mt-3 text-[11px] font-bold text-neutral-500">この人をおすすめする理由</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {r.reasons.map((x) => (
                    <li key={x} className="flex gap-1.5">
                      <span aria-hidden className="text-teal-700">✓</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-[11px] font-bold text-neutral-500">この人に聞くとよい質問</p>
                <ol className="mt-1 space-y-1.5 text-xs">
                  {r.questions.map((q, n) => (
                    <li key={q.question} className="flex gap-1.5" title={q.reason}>
                      <span className="font-bold text-teal-800">{n + 1}.</span>
                      <span>{q.question}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-3 flex gap-2">
                  <Link href={`/visit/${r.alumni.jobId}`} className="flex-1 rounded-lg border border-black/10 py-1.5 text-center text-xs hover:bg-neutral-50">
                    詳しく準備する
                  </Link>
                  <button
                    type="button"
                    disabled={requested}
                    onClick={() => logEvent({ type: "visit_request", alumniId: r.alumni.id, jobId: r.alumni.jobId, companyId: r.alumni.companyId })}
                    className="flex-1 rounded-lg bg-teal-700 py-1.5 text-xs font-bold text-white hover:bg-teal-800 disabled:bg-neutral-300 disabled:text-neutral-600"
                  >
                    {requested ? "依頼しました（デモ）" : "訪問を依頼する"}
                  </button>
                </div>
              </article>
            );
          })}
      </div>
    </aside>
  );
}
