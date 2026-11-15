import Link from "next/link";
import { companies, jobsOfCompany, sourcesOfCompany } from "@/lib/data";
import { GROWTH_LABEL } from "@/lib/types";

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <h1 className="text-2xl font-bold">企業・職種を見る</h1>
      <p className="mt-1 text-sm text-neutral-600">各職種のページで、1日の流れや年次ごとの仕事を根拠つきで確認できます。気になったらそのまま相談できます。</p>

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
        {companies.map((c) => (
          <section key={c.id} className="flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs text-neutral-500">{c.industryLabel}</p>
            <Link href={`/companies/${c.id}`} className="text-lg font-bold hover:text-teal-800">
              {c.name}
            </Link>
            <p className="mt-1 flex-1 text-sm text-neutral-600">{c.description}</p>
            <p className="mt-2 text-[11px] text-neutral-500">
              成長のしかた：{GROWTH_LABEL[c.growthType]} ・ 採用 約{c.hiringCount}人/年 ・ ソース{sourcesOfCompany(c.id).length}件
            </p>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3">
              {jobsOfCompany(c.id).map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-900 hover:bg-teal-100">
                  {j.title} →
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
