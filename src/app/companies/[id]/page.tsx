import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidenceBadges } from "@/components/EvidenceBadges";
import { GROWTH_COLOR } from "@/lib/colors";
import { ViewTracker } from "@/components/ViewTracker";
import { Card, SectionTitle } from "@/components/ui";
import { companies, getCompany, jobsOfCompany, sourcesOfCompany, sourcesOfJob } from "@/lib/data";
import { GROWTH_LABEL, QUADRANT_LABEL, SOURCE_TYPE_LABEL, type SourceType } from "@/lib/types";

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
    <div className="space-y-4">
      <ViewTracker type="view_company" companyId={id} />
      <Link href="/" className="text-xs text-neutral-500">
        ‹ 企業マップ
      </Link>
      <div>
        <p className="text-xs text-neutral-500">{company.industryLabel}</p>
        <h1 className="text-xl font-bold">{company.name}</h1>
        <p className="mt-1 text-sm text-neutral-700">{company.description}</p>
      </div>

      <Card>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-[11px] text-neutral-500">採用人数</dt>
            <dd className="text-lg font-bold">
              {company.hiringCount}
              <span className="text-xs font-normal">人/年</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-neutral-500">採用競争力</dt>
            <dd className="text-lg font-bold">{company.competitiveness}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-neutral-500">象限</dt>
            <dd className="pt-1 text-xs font-bold">{QUADRANT_LABEL[company.quadrant]}</dd>
          </div>
        </dl>
        <div className="mt-3 border-t border-black/5 pt-3">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: GROWTH_COLOR[company.growthType] }} />
            入社後の成長：{GROWTH_LABEL[company.growthType]}
          </p>
          <p className="mt-1 text-sm">{company.growthNote.text}</p>
          <EvidenceBadges evidence={company.growthNote.evidence} companyId={id} />
        </div>
      </Card>

      <div>
        <SectionTitle sub="職種を選ぶと、1日の流れや年次ごとの仕事が見られます">職種</SectionTitle>
        <div className="space-y-2">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="block rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:border-teal-700/30">
              <p className="font-bold">{j.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{j.summary}</p>
              <p className="mt-2 text-xs text-teal-800">根拠ソース {sourcesOfJob(j.id).length}件 ・ 詳しく見る →</p>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <SectionTitle>この企業の情報ソース</SectionTitle>
        <ul className="flex gap-3 text-xs">
          {byType.map(({ t, n }) => (
            <li key={t} className="flex-1 rounded-lg bg-neutral-50 p-2 text-center">
              <p className="text-neutral-500">{SOURCE_TYPE_LABEL[t]}</p>
              <p className="text-base font-bold">{n}件</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
