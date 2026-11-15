// 学生ダッシュボードと人事インサイトの集計（純粋関数）
import { getCompany, getJob, jobs, jobsOfCompany, mockStudents } from "./data";
import { QUESTION_CATEGORIES, categorize } from "./qa/dictionary";
import { searchSync } from "./qa/keywordRetriever";
import type { Quadrant, QuestionCategory, Student, StudentEvent } from "./types";

type AskEvent = Extract<StudentEvent, { type: "ask" }>;

/** モック学生の質問ログに answered / no_evidence を付ける（現在のソースで判定） */
let resolved: Student[] | null = null;
export function getMockStudents(): Student[] {
  if (resolved) return resolved;
  resolved = mockStudents.map((s) => ({
    ...s,
    events: s.events.map((e) => {
      if (e.type !== "ask" || e.status) return e;
      const r = searchSync({ text: e.question, jobId: e.jobId, companyId: e.companyId });
      return { ...e, status: r.hits.length ? "answered" : "no_evidence" } as AskEvent;
    }),
  }));
  return resolved;
}

// ------------------------------------------------------------
// 学生：解像度
// ------------------------------------------------------------
export const RESOLUTION_STEPS = ["仕事ページを見た", "根拠を開いた", "質問して答えを得た", "訪問の準備をした"] as const;

/** 職種ごとの解像度 0-4。2以上を「理解した」とみなす */
export function jobResolution(events: StudentEvent[], jobId: string): boolean[] {
  return [
    events.some((e) => e.type === "view_job" && e.jobId === jobId),
    events.some((e) => e.type === "open_evidence" && e.jobId === jobId),
    events.some((e) => e.type === "ask" && e.status === "answered" && e.jobId === jobId),
    events.some((e) => (e.type === "view_visit" || e.type === "visit_request") && e.jobId === jobId),
  ];
}

export const UNDERSTOOD_THRESHOLD = 2;

export function dashboard(events: StudentEvent[]) {
  const perJob = jobs.map((j) => {
    const steps = jobResolution(events, j.id);
    return { job: j, company: getCompany(j.companyId)!, steps, level: steps.filter(Boolean).length };
  });
  const asks = events.filter((e): e is AskEvent => e.type === "ask");
  const categories = QUESTION_CATEGORIES.map((c) => ({ category: c, count: asks.filter((a) => categorize(a.question) === c).length }));
  const quadrantCounts: Record<Quadrant, number> = { HH: 0, HL: 0, LH: 0, LL: 0 };
  for (const e of events) {
    if (e.type === "view_job" || e.type === "view_company") {
      const c = getCompany(e.companyId);
      if (c) quadrantCounts[c.quadrant]++;
    }
  }
  return {
    perJob,
    understood: perJob.filter((p) => p.level >= UNDERSTOOD_THRESHOLD).length,
    viewedCompanies: new Set(events.filter((e) => e.type === "view_company" || e.type === "view_job").map((e) => (e as { companyId: string }).companyId)).size,
    asked: asks.length,
    unanswered: asks.filter((a) => a.status === "no_evidence").length,
    categories,
    quadrantCounts,
  };
}

// ------------------------------------------------------------
// 人事：学生インサイト
// ------------------------------------------------------------
function askBelongsTo(e: AskEvent, companyId: string) {
  if (e.companyId) return e.companyId === companyId;
  if (e.jobId) return getJob(e.jobId)?.companyId === companyId;
  return false;
}

export function hrInsights(companyId: string, students: Student[]) {
  const companyJobs = jobsOfCompany(companyId);
  const all = students.flatMap((s) => s.events.map((e) => ({ s, e })));

  const views = companyJobs.map((j) => ({
    job: j,
    views: all.filter(({ e }) => e.type === "view_job" && e.jobId === j.id).length,
    uniqueStudents: new Set(all.filter(({ e }) => e.type === "view_job" && e.jobId === j.id).map(({ s }) => s.id)).size,
  }));

  const asks = all.filter((x): x is { s: Student; e: AskEvent } => x.e.type === "ask" && askBelongsTo(x.e, companyId));
  const group = (list: typeof asks) => {
    const m = new Map<string, { question: string; count: number; status: AskEvent["status"]; category: QuestionCategory; students: Set<string> }>();
    for (const { s, e } of list) {
      const cur = m.get(e.question) ?? { question: e.question, count: 0, status: e.status, category: categorize(e.question), students: new Set<string>() };
      cur.count++;
      cur.students.add(s.id);
      m.set(e.question, cur);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  };

  return {
    totalViews: views.reduce((s, v) => s + v.views, 0),
    uniqueViewers: new Set(all.filter(({ e }) => (e.type === "view_job" || e.type === "view_company") && e.companyId === companyId).map(({ s }) => s.id)).size,
    views,
    totalQuestions: asks.length,
    topQuestions: group(asks).slice(0, 8),
    unanswered: group(asks.filter((a) => a.e.status === "no_evidence")),
  };
}

/** 発信すべきコンテンツの種類の目安 */
export function contentSuggestion(category: QuestionCategory): string {
  switch (category) {
    case "待遇・選考":
      return "公式コンテンツ（制度・選考情報）";
    case "社風・働き方":
      return "社員インタビュー（働き方）";
    case "年次・キャリア":
      return "社員プロフィール（キャリアの歩み）";
    default:
      return "社員インタビュー";
  }
}

export interface IntentRow {
  student: Student;
  score: number;
  breakdown: { views: number; questions: number; deepQuestions: number; visitPrep: number; requests: number };
  lastActive: string;
}

/** 訪問意欲スコア：閲覧1点 / 質問2点 / 公開情報で答えられない質問+1点 / 訪問準備3点 / 訪問依頼5点 */
export function highIntentStudents(companyId: string, students: Student[]): IntentRow[] {
  return students
    .map((student) => {
      const ev = student.events.filter((e) => {
        if (e.type === "ask") return askBelongsTo(e, companyId);
        return "companyId" in e && e.companyId === companyId;
      });
      const b = {
        views: ev.filter((e) => e.type === "view_job" || e.type === "view_company").length,
        questions: ev.filter((e) => e.type === "ask").length,
        deepQuestions: ev.filter((e) => e.type === "ask" && e.status === "no_evidence").length,
        visitPrep: ev.filter((e) => e.type === "view_visit").length,
        requests: ev.filter((e) => e.type === "visit_request").length,
      };
      const score = b.views + b.questions * 2 + b.deepQuestions + b.visitPrep * 3 + b.requests * 5;
      const lastActive = ev.map((e) => e.ts).sort().at(-1) ?? "";
      return { student, score, breakdown: b, lastActive };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

