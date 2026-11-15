// QAサービスの組み立て。差し替えるときはここで実装クラスを入れ替えるだけでよい。
import { alumni, getSource } from "../data";
import type { Alumni } from "../types";
import { ExtractiveGenerator } from "./extractiveGenerator";
import { KeywordRetriever } from "./keywordRetriever";
import { RuleBasedRecommender } from "./ruleBasedRecommender";
import { RuleBasedSuggester } from "./ruleBasedSuggester";
import type { AlumniRecommender, AnswerGenerator, AskRequest, AskResponse, Retriever, VisitQuestionSuggester } from "./types";

const retriever: Retriever = new KeywordRetriever();
const generator: AnswerGenerator = new ExtractiveGenerator();
export const visitSuggester: VisitQuestionSuggester = new RuleBasedSuggester();
export const alumniRecommender: AlumniRecommender = new RuleBasedRecommender(visitSuggester);

export async function ask(req: AskRequest): Promise<AskResponse> {
  const retrieval = await retriever.search(req);
  const answer = await generator.generate({ question: req.text, retrieval });

  // 引用されたIDが検索結果に実在するかを必ず検証する（本物のLLMに替えたときの捏造対策）
  const allowed = new Set(retrieval.hits.map((h) => h.passage.id));
  if (answer.citations.some((c) => !allowed.has(c.passageId))) {
    throw new Error("検索結果に存在しないパッセージが引用されました");
  }

  return { ...answer, detected: retrieval.detected, suggestedAlumni: suggestAlumni(req, answer.citations.map((c) => c.sourceId), retrieval.detected.jobIds) };
}

function suggestAlumni(req: AskRequest, citedSourceIds: string[], detectedJobIds: string[]): Alumni[] {
  const jobIds = detectedJobIds.length ? detectedJobIds : req.recentJobIds?.length ? req.recentJobIds : [];
  const pool = jobIds.length ? alumni.filter((a) => jobIds.includes(a.jobId)) : alumni;
  // 引用したソースの著者を優先し、次に若い年次（学生の質問に近い経験）を優先
  const citedAuthors = new Set(citedSourceIds.map((id) => getSource(id)?.author.alumniId).filter(Boolean));
  return [...pool]
    .sort((a, b) => Number(citedAuthors.has(b.id)) - Number(citedAuthors.has(a.id)) || b.joinYear - a.joinYear)
    .slice(0, 3);
}
