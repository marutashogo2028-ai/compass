"use client";
import { useEffect, useState } from "react";
import { AlumniCard } from "@/components/AlumniCard";
import { Card, SectionTitle } from "@/components/ui";
import type { VisitQuestion } from "@/lib/qa/types";
import { useEvents } from "@/lib/store";
import type { Alumni } from "@/lib/types";

export function VisitClient({ jobId, alumni }: { jobId: string; alumni: Alumni[] }) {
  const events = useEvents();
  const [questions, setQuestions] = useState<VisitQuestion[] | null>(null);
  const [copied, setCopied] = useState(false);
  // 質問の再計算は「この職種に関する質問履歴」が変わったときだけ
  const askKey = JSON.stringify(events.filter((e) => e.type === "ask").map((e) => [e.question, e.status]));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/visit-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, events }),
    })
      .then((r) => r.json())
      .then((d: { questions: VisitQuestion[] }) => !cancelled && setQuestions(d.questions));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, askKey]);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle sub="訪問依頼のメッセージにそのまま使えます">この人に聞くとよいこと</SectionTitle>
        {!questions && <p className="text-sm text-neutral-500">準備中…</p>}
        {questions && (
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{q.question}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">理由：{q.reason}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        {questions && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n"));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-3 text-xs font-bold text-teal-800"
          >
            {copied ? "コピーしました" : "質問をコピー"}
          </button>
        )}
      </Card>

      <div>
        <SectionTitle sub="この職種のソースを書いた・話した人たち">訪問できるOB/OG</SectionTitle>
        <div className="space-y-2">
          {alumni.map((a) => (
            <AlumniCard key={a.id} alumni={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
