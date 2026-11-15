import type { ReactNode } from "react";
import { SOURCE_TYPE_LABEL, type SourceType } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-black/5 bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-2">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {sub && <p className="text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

const TYPE_ICON: Record<SourceType, string> = { visit_record: "🗣", employee_profile: "👤", official_content: "🏢" };

/** ソース種別のタグ。色だけに頼らずアイコンと文字で区別する */
export function SourceTypeTag({ type }: { type: SourceType }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700">
      <span aria-hidden>{TYPE_ICON[type]}</span>
      {SOURCE_TYPE_LABEL[type]}
    </span>
  );
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function yearLabel(joinYear: number | null) {
  return joinYear ? `${joinYear}年入社` : "企業公式";
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-600">{children}</p>;
}
