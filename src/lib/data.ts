// データの読み込みと整合性チェック。
// 本番では DB / CMS からの取得に置き換える。インターフェース（関数シグネチャ）は維持する想定。
import companiesJson from "@/data/companies.json";
import jobsJson from "@/data/jobs.json";
import sourcesJson from "@/data/sources.json";
import alumniJson from "@/data/alumni.json";
import studentsJson from "@/data/students.json";
import type { Alumni, Claim, Company, Job, Passage, Source, Student } from "./types";

export const companies = companiesJson as Company[];
export const jobs = jobsJson as Job[];
/** 公開同意のあるソースだけ。同意のないソースはアプリのどこからも参照できない */
export const sources = (sourcesJson as Source[]).filter((s) => s.consent.publicConsent);
export const alumni = alumniJson as Alumni[];
export const mockStudents = studentsJson as Student[];

const companyMap = new Map(companies.map((c) => [c.id, c]));
const jobMap = new Map(jobs.map((j) => [j.id, j]));
const sourceMap = new Map(sources.map((s) => [s.id, s]));
const passageMap = new Map<string, { passage: Passage; source: Source }>();
for (const source of sources) for (const passage of source.passages) passageMap.set(passage.id, { passage, source });

export const getCompany = (id: string) => companyMap.get(id);
export const getJob = (id: string) => jobMap.get(id);
export const getSource = (id: string) => sourceMap.get(id);
export const getPassage = (id: string) => passageMap.get(id);
export const jobsOfCompany = (companyId: string) => jobs.filter((j) => j.companyId === companyId);
export const alumniOfJob = (jobId: string) => alumni.filter((a) => a.jobId === jobId);
export const sourcesOfJob = (jobId: string) => sources.filter((s) => s.jobId === jobId);
export const sourcesOfCompany = (companyId: string) => sources.filter((s) => s.companyId === companyId);

/** 職種ページに表示されているすべての Claim */
export function claimsOfJob(job: Job): Claim[] {
  return [...job.timeline, ...job.duties, ...job.byYear.year1, ...job.byYear.year3, ...job.byYear.year5, ...job.skills];
}

// ------------------------------------------------------------
// 整合性チェック：根拠のない記述を画面に出さない
// ------------------------------------------------------------
function validate() {
  const errors: string[] = [];
  const check = (where: string, claim: Claim) => {
    if (claim.evidence.length === 0) errors.push(`${where}: 根拠がありません「${claim.text}」`);
    for (const pid of claim.evidence) {
      if (!passageMap.has(pid)) errors.push(`${where}: 存在しない（または公開同意のない）パッセージ ${pid} を参照しています`);
    }
  };
  for (const c of companies) check(`company:${c.id}.growthNote`, c.growthNote);
  for (const j of jobs) {
    if (!companyMap.has(j.companyId)) errors.push(`job:${j.id}: 企業 ${j.companyId} がありません`);
    claimsOfJob(j).forEach((cl, i) => check(`job:${j.id}#${i}`, cl));
  }
  for (const s of sources) {
    if (!companyMap.has(s.companyId)) errors.push(`source:${s.id}: 企業 ${s.companyId} がありません`);
    if (s.type === "visit_record" && !s.consent.consentedAt) errors.push(`source:${s.id}: 訪問記録に同意日がありません`);
  }
  if (errors.length) throw new Error("データの整合性エラー:\n" + errors.join("\n"));
}
validate();
