// モック学生20人と行動ログを生成する（決定的な乱数を使うので何度実行しても同じ結果）
// 使い方: node scripts/generate-students.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
const jobs = JSON.parse(readFileSync(join(root, "jobs.json"), "utf8"));
const alumni = JSON.parse(readFileSync(join(root, "alumni.json"), "utf8"));

let seed = 20261114;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const sample = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);

// 質問プール（answered/no_evidence の判定はアプリ側の検索エンジンが読み込み時に行う）
const QUESTIONS = [
  { q: "コンサルの1年目は具体的に何をする？", jobs: ["j-arc", "j-mit", "j-mib"] },
  { q: "戦略コンサルの1日のスケジュールは？", jobs: ["j-arc"] },
  { q: "アークライトで3年目に任される仕事は？", jobs: ["j-arc"] },
  { q: "アークライトの年収はどれくらい？", jobs: ["j-arc"] },
  { q: "投資銀行のアナリストに必要なスキルは？", jobs: ["j-ng"] },
  { q: "IBDの1年目は何をする？", jobs: ["j-ng"] },
  { q: "ノースゲートの選考で見られるポイントは？", jobs: ["j-ng"] },
  { q: "投資銀行の離職率は？", jobs: ["j-ng"] },
  { q: "商社のトレーディングの1年目の仕事は？", jobs: ["j-skt"] },
  { q: "蒼海物産の海外駐在のキャリアは？", jobs: ["j-skt"] },
  { q: "事業投資の3年目は何を任される？", jobs: ["j-ski"] },
  { q: "蒼海物産の事業投資の残業はどれくらい？", jobs: ["j-ski"] },
  { q: "ITコンサルにプログラミングスキルは必要？", jobs: ["j-mit"] },
  { q: "ミライドのITコンサルの働き方は？", jobs: ["j-mit"] },
  { q: "ミライドの福利厚生は？", jobs: ["j-mit", "j-mib"] },
  { q: "ビジネスコンサルの1年目は？", jobs: ["j-mib"] },
  { q: "広告代理店の営業の1日は？", jobs: ["j-hk"] },
  { q: "博陽エージェンシーで5年目に任される仕事は？", jobs: ["j-hk"] },
  { q: "博陽エージェンシーの初任給は？", jobs: ["j-hk"] },
  { q: "スタートアップの事業開発の1年目は？", jobs: ["j-lm"] },
  { q: "ルミナの社風は？", jobs: ["j-lm"] },
  { q: "ルミナ・ヘルステックの住宅手当は？", jobs: ["j-lm"] },
  { q: "カスタマーサクセスに必要なスキルは？", jobs: ["j-ct"] },
  { q: "カタリスト・ロジのCSの5年目のキャリアは？", jobs: ["j-ct"] },
  { q: "東邦精機の法人営業の残業は？", jobs: ["j-th"] },
  { q: "東邦精機の面接では何を聞かれる？", jobs: ["j-th"] },
];

const INTEREST_GROUPS = [
  { label: "コンサル", jobs: ["j-arc", "j-mit", "j-mib"] },
  { label: "金融", jobs: ["j-ng", "j-ski"] },
  { label: "商社", jobs: ["j-skt", "j-ski"] },
  { label: "広告・マーケ", jobs: ["j-hk", "j-lm"] },
  { label: "スタートアップ", jobs: ["j-lm", "j-ct"] },
  { label: "メーカー", jobs: ["j-th", "j-skt"] },
];
const GRADES = ["学部3年", "学部3年", "学部3年", "修士1年", "学部4年"];
const MAJORS = ["経済学部", "法学部", "商学部", "文学部", "理工学部", "情報学部", "国際教養学部"];

const start = Date.parse("2026-10-15T09:00:00+09:00");
const end = Date.parse("2026-11-13T22:00:00+09:00");
const ts = () => new Date(start + rand() * (end - start)).toISOString();
const jobById = Object.fromEntries(jobs.map((j) => [j.id, j]));

const students = [];
for (let i = 1; i <= 20; i++) {
  const interests = sample(INTEREST_GROUPS, rand() < 0.5 ? 1 : 2);
  const focusJobs = [...new Set(interests.flatMap((g) => g.jobs))];
  const otherJobs = jobs.map((j) => j.id).filter((id) => !focusJobs.includes(id));
  const intensity = 0.3 + rand() * 1.2; // 学生ごとの活発さ
  const events = [];

  const viewed = [...sample(focusJobs, Math.max(1, Math.round(focusJobs.length * intensity))), ...sample(otherJobs, Math.round(rand() * 2))];
  for (const jobId of viewed) {
    const companyId = jobById[jobId].companyId;
    events.push({ type: "view_company", ts: ts(), companyId });
    const n = 1 + Math.floor(rand() * 3 * intensity);
    for (let k = 0; k < n; k++) events.push({ type: "view_job", ts: ts(), jobId, companyId });
    if (rand() < 0.6 * intensity) events.push({ type: "open_evidence", ts: ts(), jobId, companyId });
  }

  const pool = QUESTIONS.filter((q) => q.jobs.some((j) => viewed.includes(j)));
  const nq = Math.min(pool.length, Math.round(rand() * 4 * intensity));
  for (const q of sample(pool, nq)) {
    const jobId = q.jobs.length === 1 ? q.jobs[0] : undefined;
    events.push({ type: "ask", ts: ts(), question: q.q, ...(jobId ? { jobId, companyId: jobById[jobId].companyId } : {}) });
  }

  if (intensity > 0.9) {
    const jobId = pick(viewed);
    const companyId = jobById[jobId].companyId;
    events.push({ type: "view_visit", ts: ts(), jobId, companyId });
    if (rand() < 0.6) {
      const al = pick(alumni.filter((a) => a.jobId === jobId));
      events.push({ type: "visit_request", ts: ts(), alumniId: al.id, jobId, companyId });
    }
  }

  events.sort((a, b) => a.ts.localeCompare(b.ts));
  students.push({
    id: `stu-${String(i).padStart(2, "0")}`,
    anonId: `学生#${(1000 + Math.floor(rand() * 9000)).toString()}`,
    grade: pick(GRADES),
    major: pick(MAJORS),
    interests: interests.map((g) => g.label),
    events,
  });
}

writeFileSync(join(root, "students.json"), JSON.stringify(students, null, 2) + "\n");
console.log(`wrote ${students.length} students, ${students.reduce((s, x) => s + x.events.length, 0)} events`);
