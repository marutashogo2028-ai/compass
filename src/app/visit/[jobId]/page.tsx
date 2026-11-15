import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTracker } from "@/components/ViewTracker";
import { alumniOfJob, getCompany, getJob, jobs } from "@/lib/data";
import { VisitClient } from "./VisitClient";

export function generateStaticParams() {
  return jobs.map((j) => ({ jobId: j.id }));
}

// モックデータはローカルにあり即時に描画できるため、URLパラメータ待ちのブロッキングを許可する
export const instant = false;

export default async function VisitPage({ params }: PageProps<"/visit/[jobId]">) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) notFound();
  const company = getCompany(job.companyId)!;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-8 py-8">
      <ViewTracker type="view_visit" jobId={jobId} companyId={company.id} />
      <Link href={`/jobs/${jobId}`} className="text-xs text-neutral-500">
        ‹ {job.title}
      </Link>
      <div>
        <p className="text-xs text-neutral-500">OB/OG訪問の準備</p>
        <h1 className="text-2xl font-bold">
          {company.name}／{job.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">見た内容と質問履歴から、公開情報では分からないこと＝OB/OGに聞く価値があることを選びました。</p>
      </div>
      <VisitClient jobId={jobId} alumni={alumniOfJob(jobId)} />
    </div>
  );
}
