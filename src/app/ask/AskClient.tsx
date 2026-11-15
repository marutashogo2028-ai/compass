"use client";
import { useEffect, useRef, useState } from "react";
import { AlumniCard } from "@/components/AlumniCard";
import { EvidenceSheet } from "@/components/EvidenceBadges";
import { SourceTypeTag, formatDate, yearLabel } from "@/components/ui";
import { getCompany, getJob, jobs } from "@/lib/data";
import type { AskResponse } from "@/lib/qa/types";
import { logEvent, useEvents } from "@/lib/store";

type Turn = { id: number; question: string; res?: AskResponse; error?: string };

const SAMPLES = [
  "コンサルの1年目は具体的に何をする？",
  "ITコンサルにプログラミングスキルは必要？",
  "商社のトレーディングの1日は？",
  "カスタマーサクセスの5年目のキャリアは？",
  "アークライトの年収はどれくらい？",
];

export function AskClient({ initialJobId }: { initialJobId: string }) {
  const events = useEvents();
  const [jobId, setJobId] = useState(getJob(initialJobId) ? initialJobId : "");
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    const id = Date.now();
    setTurns((t) => [...t, { id, question: q }]);
    setText("");
    setLoading(true);
    try {
      const recentJobIds = [...new Set(events.filter((e) => e.type === "view_job").map((e) => (e as { jobId: string }).jobId))].slice(-5);
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q, jobId: jobId || undefined, recentJobIds }),
      });
      const res = (await r.json()) as AskResponse & { error?: string };
      if (!r.ok) throw new Error(res.error ?? "エラーが発生しました");
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, res } : x)));

      const loggedJob = jobId || (res.detected.jobIds.length === 1 ? res.detected.jobIds[0] : undefined);
      const loggedCompany = loggedJob ? getJob(loggedJob)?.companyId : res.detected.companyIds.length === 1 ? res.detected.companyIds[0] : undefined;
      logEvent({ type: "ask", question: q, status: res.status, jobId: loggedJob, companyId: loggedCompany });
    } catch (e) {
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, error: (e as Error).message } : x)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">仕事Q&A</h1>
        <p className="mt-1 text-sm text-neutral-600">登録されたソースだけを根拠に答えます。根拠がない質問には「情報がありません」と返し、聞くべきOB/OGを紹介します。</p>
      </div>

      <label className="block text-xs text-neutral-600">
        対象の職種
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-1 block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
          <option value="">すべての職種（質問文から判断）</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {getCompany(j.companyId)?.name}／{j.title}
            </option>
          ))}
        </select>
      </label>

      {turns.length === 0 && (
        <div>
          <p className="mb-2 text-xs text-neutral-500">例えばこんな質問</p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs hover:border-teal-700/40">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {turns.map((t) => (
          <div key={t.id} className="space-y-2">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-teal-700 px-3.5 py-2 text-sm text-white">{t.question}</div>
            {t.error && <p className="text-sm text-red-700">{t.error}</p>}
            {!t.res && !t.error && <p className="text-sm text-neutral-500">ソースを検索しています…</p>}
            {t.res && <Answer res={t.res} onOpen={setSheet} />}
          </div>
        ))}
      </div>
      <div ref={bottom} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="sticky bottom-20 flex gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-md"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例：広告代理店の営業の1日は？"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          maxLength={300}
        />
        <button disabled={loading || !text.trim()} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:bg-neutral-300">
          質問
        </button>
      </form>

      {sheet && <EvidenceSheet passageId={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Answer({ res, onOpen }: { res: AskResponse; onOpen: (passageId: string) => void }) {
  const noEvidence = res.status === "no_evidence";
  return (
    <div className="animate-fade-up space-y-2">
      <div className={`rounded-2xl rounded-bl-sm border p-3.5 text-sm leading-relaxed ${noEvidence ? "border-amber-300 bg-amber-50" : "border-black/5 bg-white"}`}>
        {noEvidence && <p className="mb-1 text-xs font-bold text-amber-900">⚠ 根拠なし</p>}
        {res.segments.map((s, i) => (
          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
            {s.text}
            {s.citationIds.map((c) => (
              <a key={c} href={`#cite-${c}`} className="ml-0.5 align-super text-[10px] font-bold text-teal-800">
                [{c}]
              </a>
            ))}
          </p>
        ))}
      </div>

      {res.citations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-neutral-600">引用したソース</p>
          {res.citations.map((c) => (
            <button
              key={c.id}
              id={`cite-${c.id}`}
              onClick={() => onOpen(c.passageId)}
              className="block w-full rounded-xl border border-black/5 bg-white p-2.5 text-left hover:border-teal-700/30"
            >
              <span className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-teal-800">[{c.id}]</span>
                <SourceTypeTag type={c.sourceType} />
                <span className="text-neutral-700">
                  {c.companyName}／{c.jobTitle}
                </span>
              </span>
              <span className="mt-1 block text-[11px] text-neutral-500">
                {c.authorName}・{yearLabel(c.joinYear)}・{formatDate(c.date)}
              </span>
            </button>
          ))}
        </div>
      )}

      {res.suggestedAlumni.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-neutral-600">{noEvidence ? "この質問を直接聞けそうなOB/OG" : "もっと深く聞くなら"}</p>
          {(noEvidence ? res.suggestedAlumni : res.suggestedAlumni.slice(0, 1)).map((a) => (
            <AlumniCard key={a.id} alumni={a} showVisitLink />
          ))}
        </div>
      )}
    </div>
  );
}
