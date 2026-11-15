import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidenceBadges } from "@/components/EvidenceBadges";
import { ViewTracker } from "@/components/ViewTracker";
import { Card, EmptyNote, SectionTitle } from "@/components/ui";
import { getCompany, getJob, jobs, sourcesOfJob } from "@/lib/data";
import type { Claim } from "@/lib/types";

export function generateStaticParams() {
  return jobs.map((j) => ({ id: j.id }));
}

function ClaimList({ claims, jobId, companyId, emptyText }: { claims: Claim[]; jobId: string; companyId: string; emptyText?: string }) {
  if (claims.length === 0) return <EmptyNote>{emptyText ?? "根拠となる情報がまだありません。"}</EmptyNote>;
  return (
    <ul className="space-y-3">
      {claims.map((c, i) => (
        <li key={i} className="text-sm leading-relaxed">
          {c.text}
          <EvidenceBadges evidence={c.evidence} jobId={jobId} companyId={companyId} />
        </li>
      ))}
    </ul>
  );
}

// モックデータはローカルにあり即時に描画できるため、URLパラメータ待ちのブロッキングを許可する
export const instant = false;

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();
  const company = getCompany(job.companyId)!;
  const nSources = sourcesOfJob(id).length;
  const years = [
    { key: "year1", label: "1年目" },
    { key: "year3", label: "3年目" },
    { key: "year5", label: "5年目" },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-8 py-8">
      <ViewTracker type="view_job" jobId={id} companyId={company.id} />
      <Link href={`/companies/${company.id}`} className="text-xs text-neutral-500 hover:text-neutral-800">
        ‹ {company.name}
      </Link>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs text-neutral-500">{company.name}</p>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="mt-1 text-sm text-neutral-700">{job.summary}</p>
          <p className="mt-2 text-xs text-neutral-500">
            すべての項目に根拠があります（ソース{nSources}件）。<span className="text-teal-800">📎バッジ</span>をクリックすると原文を確認できます。
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/?job=${id}`} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800">
            この仕事について相談する
          </Link>
          <Link href={`/visit/${id}`} className="rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-50">
            OB/OG訪問の準備
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[340px_1fr] items-start gap-5">
        <Card>
          <SectionTitle>1日のタイムライン</SectionTitle>
          <ol className="relative ml-1 border-l-2 border-teal-700/20">
            {job.timeline.map((t, i) => (
              <li key={i} className="relative pb-4 pl-4 last:pb-0">
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-700" />
                <p className="text-xs font-bold text-teal-800">{t.time}</p>
                <p className="text-sm">{t.text}</p>
                <EvidenceBadges evidence={t.evidence} jobId={id} companyId={company.id} />
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionTitle sub="入社年次ごとに任される仕事">年次ごとの仕事</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              {years.map((y) => (
                <div key={y.key}>
                  <p className="mb-2 rounded-md bg-teal-700 py-1 text-center text-xs font-bold text-white">{y.label}</p>
                  <ClaimList
                    claims={job.byYear[y.key]}
                    jobId={id}
                    companyId={company.id}
                    emptyText={`${y.label}の仕事についての公開情報はまだありません。OB/OG訪問で聞いてみましょう。`}
                  />
                </div>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-5">
            <Card>
              <SectionTitle>主な業務</SectionTitle>
              <ClaimList claims={job.duties} jobId={id} companyId={company.id} />
            </Card>
            <Card>
              <SectionTitle>必要なスキル</SectionTitle>
              <ClaimList claims={job.skills} jobId={id} companyId={company.id} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
