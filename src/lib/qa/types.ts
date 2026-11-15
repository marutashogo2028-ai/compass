// ============================================================
// 回答生成のインターフェース
// 検索（Retriever）と生成（AnswerGenerator）を分け、それぞれ差し替え可能にする。
//   モック : KeywordRetriever + ExtractiveGenerator
//   本番例 : ベクトル検索 Retriever + Claude API Generator
// ============================================================
import type { Alumni, Passage, Source, SourceType, StudentEvent, Topic } from "../types";

export interface RetrievalQuery {
  text: string;
  /** 画面側で企業・職種が絞り込まれている場合に指定 */
  companyId?: string;
  jobId?: string;
  limit?: number;
}

export interface RetrievalHit {
  passage: Passage;
  source: Source;
  score: number;
}

export interface RetrievalResult {
  hits: RetrievalHit[];
  /** 質問から読み取れた対象（ログ・インサイト集計とOB/OG提案に使う） */
  detected: { companyIds: string[]; jobIds: string[]; topics: Topic[] };
}

export interface Retriever {
  search(query: RetrievalQuery): Promise<RetrievalResult>;
}

export interface Citation {
  /** 回答文中の [1] [2] に対応する番号 */
  id: string;
  passageId: string;
  sourceId: string;
  sourceType: SourceType;
  sourceTitle: string;
  companyId: string;
  companyName: string;
  jobTitle: string;
  authorName: string;
  joinYear: number | null;
  date: string;
  quote: string;
}

export interface AnswerSegment {
  text: string;
  /** この文の根拠になる Citation.id。空なら根拠を要さないつなぎの文 */
  citationIds: string[];
}

export interface GeneratedAnswer {
  status: "answered" | "no_evidence";
  segments: AnswerSegment[];
  citations: Citation[];
}

export interface AnswerGenerator {
  /** hits に含まれる情報だけを根拠に回答する。根拠が足りなければ no_evidence を返す */
  generate(input: { question: string; retrieval: RetrievalResult }): Promise<GeneratedAnswer>;
}

export interface AskRequest extends RetrievalQuery {
  /** OB/OG提案の参考にする閲覧履歴（任意） */
  recentJobIds?: string[];
}

export interface AskResponse extends GeneratedAnswer {
  detected: RetrievalResult["detected"];
  suggestedAlumni: Alumni[];
}

export interface VisitQuestion {
  question: string;
  /** なぜこの質問を勧めるか（学生に見せる） */
  reason: string;
}

export interface VisitQuestionSuggester {
  suggest(ctx: { jobId: string; events: StudentEvent[] }): Promise<VisitQuestion[]>;
}
