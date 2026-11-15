"use client";
import Link from "next/link";
import { useState } from "react";
import { getCompany, getJob } from "@/lib/data";
import { logEvent, useEvents } from "@/lib/store";
import type { Alumni } from "@/lib/types";

export function AlumniCard({ alumni, showVisitLink = false }: { alumni: Alumni; showVisitLink?: boolean }) {
  const events = useEvents();
  const [toast, setToast] = useState(false);
  const requested = events.some((e) => e.type === "visit_request" && e.alumniId === alumni.id);
  const company = getCompany(alumni.companyId);
  const job = getJob(alumni.jobId);

  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-100 font-bold text-teal-900">
          {alumni.displayName.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {alumni.displayName}
            <span className="ml-1 text-xs font-normal text-neutral-500">{alumni.joinYear}年入社</span>
          </p>
          <p className="truncate text-xs text-neutral-600">
            {company?.name}／{job?.title}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-700">{alumni.oneLiner}</p>
      <div className="mt-2 flex gap-2">
        {showVisitLink && (
          <Link href={`/visit/${alumni.jobId}`} className="flex-1 rounded-lg border border-teal-700 py-1.5 text-center text-xs font-bold text-teal-800">
            聞くことを準備する
          </Link>
        )}
        <button
          type="button"
          disabled={requested}
          onClick={() => {
            logEvent({ type: "visit_request", alumniId: alumni.id, jobId: alumni.jobId, companyId: alumni.companyId });
            setToast(true);
            setTimeout(() => setToast(false), 2500);
          }}
          className="flex-1 rounded-lg bg-teal-700 py-1.5 text-xs font-bold text-white disabled:bg-neutral-300 disabled:text-neutral-600"
        >
          {requested ? "依頼済み" : "訪問を依頼する"}
        </button>
      </div>
      {toast && (
        <div role="status" className="animate-fade-up fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm text-white shadow-lg">
          {alumni.displayName}に訪問依頼を送りました（デモ）
        </div>
      )}
    </div>
  );
}
