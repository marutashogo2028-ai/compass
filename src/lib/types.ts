// ============================================================
// ドメインモデル
// 仕事に関する記述はすべて Source（の Passage）を根拠に持つ。
// ============================================================

/** 情報ソースの種類 */
export type SourceType = "visit_record" | "employee_profile" | "official_content";

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  visit_record: "OB/OG訪問記録",
  employee_profile: "社員プロフィール",
  official_content: "公式コンテンツ",
};

/** パッセージに付くトピック。検索とダッシュボードの分類に使う */
export type Topic =
  | "daily" // 1日の流れ
  | "duties" // 主な業務
  | "year1"
  | "year3"
  | "year5"
  | "skills"
  | "culture" // 社風・チーム
  | "career" // キャリアパス・成長
  | "worklife" // 働き方・残業・休み
  // 以下はモックのソースにパッセージが存在しない（＝根拠なしになる）トピック
  | "salary"
  | "selection"
  | "benefits";

export interface Passage {
  /** "<sourceId>#p<n>" */
  id: string;
  text: string;
  topics: Topic[];
}

export interface Source {
  id: string;
  type: SourceType;
  companyId: string;
  /** null なら企業全体についての情報 */
  jobId: string | null;
  /** 表示用の職種名 */
  jobTitle: string;
  author: {
    /** OB/OG 本人。公式コンテンツなら null */
    alumniId: string | null;
    /** 匿名の表示名 */
    displayName: string;
    /** 入社年次 */
    joinYear: number | null;
  };
  /** 情報の日付 (YYYY-MM-DD) */
  date: string;
  title: string;
  passages: Passage[];
  consent: {
    /** false のソースは検索・表示の対象外 */
    publicConsent: boolean;
    consentedAt: string | null;
  };
}

/** 画面に出す1つの記述。evidence は Passage.id の配列（1件以上必須） */
export interface Claim {
  text: string;
  evidence: string[];
}

export interface TimelineItem extends Claim {
  time: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  summary: string;
  /** 検索で職種を特定するための別名 */
  aliases: string[];
  timeline: TimelineItem[];
  duties: Claim[];
  byYear: { year1: Claim[]; year3: Claim[]; year5: Claim[] };
  skills: Claim[];
}

export type Quadrant = "HH" | "HL" | "LH" | "LL"; // 競争力(H/L) × 採用人数(H/L)

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  HH: "高競争力 × 多人数",
  HL: "高競争力 × 少人数",
  LH: "低競争力 × 多人数",
  LL: "低競争力 × 少人数",
};

export type GrowthType = "early_ownership" | "specialist" | "structured";

export const GROWTH_LABEL: Record<GrowthType, string> = {
  early_ownership: "早期裁量型",
  specialist: "専門性型",
  structured: "育成体系型",
};

export interface Company {
  id: string;
  name: string;
  industryLabel: string;
  aliases: string[];
  description: string;
  /** 年間の新卒採用人数（横軸） */
  hiringCount: number;
  /** 採用競争力 0-100（縦軸） */
  competitiveness: number;
  quadrant: Quadrant;
  growthType: GrowthType;
  growthNote: Claim;
}

export interface Alumni {
  id: string;
  displayName: string;
  companyId: string;
  jobId: string;
  joinYear: number;
  oneLiner: string;
}

export type QuestionCategory = "業務内容" | "年次・キャリア" | "スキル" | "社風・働き方" | "待遇・選考" | "その他";

export type StudentEvent =
  | { type: "view_company"; ts: string; companyId: string }
  | { type: "view_job"; ts: string; jobId: string; companyId: string }
  | { type: "open_evidence"; ts: string; jobId: string; companyId: string }
  | { type: "view_visit"; ts: string; jobId: string; companyId: string }
  | {
      type: "ask";
      ts: string;
      question: string;
      /** 回答時点の判定。モック学生のログでは読み込み時に現在のソースで判定する */
      status?: "answered" | "no_evidence";
      companyId?: string;
      jobId?: string;
    }
  | { type: "visit_request"; ts: string; alumniId: string; jobId: string; companyId: string };

export interface Student {
  id: string;
  anonId: string;
  grade: string;
  major: string;
  interests: string[];
  events: StudentEvent[];
}
