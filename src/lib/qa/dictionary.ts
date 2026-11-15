// キーワード辞書（モック検索用）。本番のベクトル検索に替えたら不要になる。
import type { QuestionCategory, Topic } from "../types";

export const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  daily: ["1日", "一日", "スケジュール", "朝", "何時", "タイムライン"],
  duties: ["仕事", "業務", "何をする", "何する", "具体的", "担当", "役割", "内容"],
  year1: ["1年目", "一年目", "新卒", "新人", "入社直後", "若手", "最初"],
  year3: ["3年目", "三年目", "2年目", "二年目", "中堅"],
  year5: ["5年目", "五年目", "将来", "マネージャー"],
  skills: ["スキル", "能力", "必要", "勉強", "資格", "向いて", "求め", "プログラミング", "英語"],
  culture: ["社風", "雰囲気", "文化", "人間関係", "チーム", "カルチャー"],
  career: ["キャリア", "昇進", "昇格", "駐在", "海外", "異動", "出向", "ローテーション", "成長", "育成"],
  worklife: ["残業", "休み", "休日", "働き方", "リモート", "在宅", "ワークライフ", "忙しい", "有給", "転勤"],
  salary: ["年収", "給料", "給与", "初任給", "ボーナス", "報酬", "収入"],
  selection: ["選考", "面接", "ES", "エントリー", "倍率", "内定", "採用基準"],
  benefits: ["福利厚生", "手当", "住宅", "社宅", "寮"],
};

export const TOPIC_LABEL: Record<Topic, string> = {
  daily: "1日の流れ",
  duties: "業務内容",
  year1: "1年目",
  year3: "3年目",
  year5: "5年目",
  skills: "スキル",
  culture: "社風・チーム",
  career: "キャリアパス",
  worklife: "働き方",
  salary: "給与・年収",
  selection: "選考",
  benefits: "福利厚生",
};

/** 「業務内容」は汎用語なので、これだけでは絞り込みに使わない */
export const GENERIC_TOPICS: Topic[] = ["duties"];

export const TOPIC_CATEGORY: Record<Topic, QuestionCategory> = {
  daily: "業務内容",
  duties: "業務内容",
  year1: "年次・キャリア",
  year3: "年次・キャリア",
  year5: "年次・キャリア",
  career: "年次・キャリア",
  skills: "スキル",
  culture: "社風・働き方",
  worklife: "社風・働き方",
  salary: "待遇・選考",
  selection: "待遇・選考",
  benefits: "待遇・選考",
};

export const QUESTION_CATEGORIES: QuestionCategory[] = ["業務内容", "年次・キャリア", "スキル", "社風・働き方", "待遇・選考", "その他"];

/** 自由語として扱わない語 */
export const STOPWORDS = ["会社", "企業", "どれくらい", "どのくらい", "ですか", "ますか", "教えて", "ください", "について", "どんな", "どう", "とは"];

export function detectTopics(text: string): Topic[] {
  return (Object.keys(TOPIC_KEYWORDS) as Topic[]).filter((t) => TOPIC_KEYWORDS[t].some((k) => text.includes(k)));
}

export function categorize(question: string): QuestionCategory {
  const topics = detectTopics(question);
  const specific = topics.find((t) => !GENERIC_TOPICS.includes(t));
  const t = specific ?? topics[0];
  return t ? TOPIC_CATEGORY[t] : "その他";
}
