import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidenceBadges } from "@/components/EvidenceBadges";
import { ViewTracker } from "@/components/ViewTracker";
import { Card, SectionTitle } from "@/components/ui";
import { companies, getCompany, jobsOfCompany, sourcesOfCompany, sourcesOfJob } from "@/lib/data";
import { GROWTH_LABEL, SOURCE_TYPE_LABEL, type SourceType } from "@/lib/types";

export function generateStaticParams() {
  return companies.map((c) => ({ id: c.id }));
}

// モックデータはローカルにあり即時に描画できるため、URLパラメータ待ちのブロッキングを許可する
export const instant = false;

export default async function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const company = getCompany(id);
  if (!company) notFound();
  const jobs = jobsOfCompany(id);
  const srcs = sourcesOfCompany(id);
  const byType = (Object.keys(SOURCE_TYPE_LABEL) as SourceType[]).map((t) => ({ t, n: srcs.filter((s) => s.type === t).length }));

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-8 py-8">
      <ViewTracker type="view_company" companyId={id} />
      <Link href="/companies" className="text-xs text-neutral-500 hover:text-neutral-800">
        ‹ 企業・職種一覧
      </Link>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-500">{company.industryLabel}</p>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="mt-1 text-sm text-neutral-700">{company.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div className="space-y-3">
          <SectionTitle sub="職種を選ぶと、1日の流れや年次ごとの仕事が見られます">職種</SectionTitle>
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <Link href={`/jobs/${j.id}`} className="text-lg font-bold hover:text-teal-800">
                {j.title}
              </Link>
              <p className="mt-1 text-sm text-neutral-600">{j.summary}</p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="text-neutral-500">根拠ソース {sourcesOfJob(j.id).length}件</span>
                <Link href={`/jobs/${j.id}`} className="font-bold text-teal-800">
                  詳しく見る →
                </Link>
                <Link href={`/?job=${j.id}`} className="font-bold text-teal-800">
                  この仕事について相談する →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle>入社後の成長</SectionTitle>
            <p className="text-sm font-bold">{GROWTH_LABEL[company.growthType]}</p>
            <p className="mt-1 text-sm">{company.growthNote.text}</p>
            <EvidenceBadges evidence={company.growthNote.evidence} companyId={id} />
            <p className="mt-3 border-t border-black/5 pt-3 text-xs text-neutral-500">新卒採用 約{company.hiringCount}人/年</p>
          </Card>
          <Card>
            <SectionTitle>この企業の情報ソース</SectionTitle>
            <ul className="space-y-1.5 text-sm">
              {byType.map(({ t, n }) => (
                <li key={t} className="flex justify-between">
                  <span className="text-neutral-600">{SOURCE_TYPE_LABEL[t]}</span>
                  <span className="font-bold">{n}件</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
