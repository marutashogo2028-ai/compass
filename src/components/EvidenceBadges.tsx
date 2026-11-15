"use client";
// 各記述の根拠バッジ。タップで引用元の原文を表示する。
import { useState } from "react";
import { getCompany, getPassage } from "@/lib/data";
import { logEvent } from "@/lib/store";
import { SOURCE_TYPE_LABEL } from "@/lib/types";
import { SourceTypeTag, formatDate, yearLabel } from "./ui";

const SHORT: Record<string, string> = { visit_record: "訪問記録", employee_profile: "プロフィール", official_content: "公式" };

export function EvidenceBadges({ evidence, jobId, companyId }: { evidence: string[]; jobId?: string; companyId: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const items = evidence.map((id) => ({ id, ...getPassage(id)! })).filter((x) => x.source);

  return (
    <>
      <span className="mt-1 flex flex-wrap gap-1">
        {items.map(({ id, source }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setOpen(id);
              if (jobId) logEvent({ type: "open_evidence", jobId, companyId });
            }}
            className="inline-flex items-center gap-1 rounded-full border border-teal-700/20 bg-teal-50 px-2 py-0.5 text-[10.5px] text-teal-900 hover:bg-teal-100"
            aria-label={`根拠：${SOURCE_TYPE_LABEL[source.type]}、${yearLabel(source.author.joinYear)}、${formatDate(source.date)}`}
          >
            <span aria-hidden>📎</span>
            {SHORT[source.type]}｜{source.author.joinYear ? `${source.author.joinYear}入社` : "公式"}｜{source.date.slice(0, 7)}
          </button>
        ))}
      </span>
      {open && <EvidenceSheet passageId={open} onClose={() => setOpen(null)} />}
    </>
  );
}

export function EvidenceSheet({ passageId, onClose }: { passageId: string; onClose: () => void }) {
  const found = getPassage(passageId);
  if (!found) return null;
  const { passage, source } = found;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="根拠ソース">
      <div className="animate-fade-up w-full max-w-xl rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <SourceTypeTag type={source.type} />
            <p className="mt-1 text-sm font-bold">{source.title}</p>
          </div>
          <button onClick={onClose} className="rounded-full px-2 text-xl leading-none text-neutral-500" aria-label="閉じる">
            ×
          </button>
        </div>
        <blockquote className="rounded-xl border-l-4 border-teal-700 bg-neutral-50 p-3 text-sm leading-relaxed">{passage.text}</blockquote>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-neutral-500">企業</dt>
          <dd>{getCompany(source.companyId)?.name}</dd>
          <dt className="text-neutral-500">職種</dt>
          <dd>{source.jobTitle}</dd>
          <dt className="text-neutral-500">書いた人</dt>
          <dd>
            {source.author.displayName}（{yearLabel(source.author.joinYear)}）
          </dd>
          <dt className="text-neutral-500">日付</dt>
          <dd>{formatDate(source.date)}</dd>
          {source.type === "visit_record" && (
            <>
              <dt className="text-neutral-500">公開同意</dt>
              <dd>本人同意済み（{source.consent.consentedAt}）</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
