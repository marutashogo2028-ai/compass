// モック検索：キーワード辞書による簡易検索。
// 企業名・職種名で範囲を絞り、トピック一致と語の一致でパッセージに点数を付ける。
import { companies, jobs, sources } from "../data";
import type { Topic } from "../types";
import { GENERIC_TOPICS, STOPWORDS, TOPIC_KEYWORDS, detectTopics } from "./dictionary";
import type { RetrievalHit, RetrievalQuery, RetrievalResult, Retriever } from "./types";

/** 最も長く一致した別名を持つものだけを残す（「戦略コンサル」は「コンサル」より優先） */
function bestAliasMatches<T extends { id: string; aliases: string[]; name?: string; title?: string }>(text: string, items: T[]): string[] {
  let best = 0;
  const scored = items.map((it) => {
    const names = [...it.aliases, it.name ?? "", it.title ?? ""].filter(Boolean);
    const len = Math.max(0, ...names.filter((n) => text.includes(n)).map((n) => n.length));
    best = Math.max(best, len);
    return { id: it.id, len };
  });
  return best === 0 ? [] : scored.filter((s) => s.len === best).map((s) => s.id);
}

function extractTerms(text: string): string[] {
  let rest = text;
  const remove = [
    ...companies.flatMap((c) => [c.name, ...c.aliases]),
    ...jobs.flatMap((j) => [j.title, ...j.aliases]),
    ...Object.values(TOPIC_KEYWORDS).flat(),
    ...STOPWORDS,
  ].sort((a, b) => b.length - a.length);
  for (const w of remove) rest = rest.split(w).join(" ");
  return (rest.match(/[一-龯々ァ-ヶーA-Za-z0-9]{2,}/g) ?? []).filter((t) => !STOPWORDS.includes(t));
}

export function parseQuery(q: RetrievalQuery) {
  const text = q.text;
  const companyIds = q.companyId ? [q.companyId] : bestAliasMatches(text, companies);
  let jobIds = q.jobId ? [q.jobId] : bestAliasMatches(text, jobs);
  if (companyIds.length) {
    const inCompany = jobIds.filter((id) => companyIds.includes(jobs.find((j) => j.id === id)!.companyId));
    jobIds = inCompany.length ? inCompany : jobs.filter((j) => companyIds.includes(j.companyId)).map((j) => j.id);
  }
  // 質問文から特定できなければ、会話で絞り込んだ範囲を使う
  if (!companyIds.length && !jobIds.length && q.scopeJobIds?.length) jobIds = [...q.scopeJobIds];
  const topics = detectTopics(text);
  // 企業・職種だけ指定された質問（「ルミナってどんな会社？」）は業務内容の質問として扱う
  if (topics.length === 0 && (companyIds.length || jobIds.length) && extractTerms(text).length === 0) topics.push("duties");
  return { companyIds, jobIds, topics, terms: extractTerms(text) };
}

/** 同期版のコア処理。モックログの判定にも使う */
export function searchSync(q: RetrievalQuery): RetrievalResult {
  const { companyIds, jobIds, topics, terms } = parseQuery(q);
  const specific = topics.filter((t) => !GENERIC_TOPICS.includes(t));
  // 年次を聞かれたら、その年次の根拠を必須にする（「5年目のキャリア」に一般的なキャリア論で答えない）
  const years = specific.filter((t) => t === "year1" || t === "year3" || t === "year5");
  const required = years.length ? years : specific;
  const bonus = specific.filter((t) => !required.includes(t));
  const wantsDuties = topics.some((t) => GENERIC_TOPICS.includes(t));

  const scope = sources.filter((s) => {
    if (jobIds.length) return (s.jobId && jobIds.includes(s.jobId)) || (s.jobId === null && companyIds.includes(s.companyId));
    if (companyIds.length) return companyIds.includes(s.companyId);
    return true;
  });

  const candidates: RetrievalHit[] = [];
  for (const source of scope) {
    for (const passage of source.passages) {
      const termHits = terms.filter((t) => passage.text.includes(t)).length;
      const matched = required.filter((t) => passage.topics.includes(t as Topic)).length;
      let score = 0;
      if (required.length) {
        if (matched === 0) continue;
        const bonusHits = bonus.filter((t) => passage.topics.includes(t)).length;
        score = matched * 3 + bonusHits + (wantsDuties && passage.topics.includes("duties") ? 1 : 0) + termHits;
      } else if (wantsDuties) {
        if (!passage.topics.includes("duties") && termHits === 0) continue;
        score = 2 + termHits + (passage.topics.includes("duties") ? 1 : 0);
      } else {
        if (termHits < 1) continue;
        score = termHits;
      }
      candidates.push({ passage, source, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.source.date.localeCompare(a.source.date));

  // 多様性：まず職種ごとに1件、次にソースが重複しないように選ぶ
  const limit = q.limit ?? 3;
  const picked: RetrievalHit[] = [];
  const usedJobs = new Set<string>();
  const usedSources = new Set<string>();
  for (const c of candidates) {
    const key = c.source.jobId ?? c.source.companyId;
    if (picked.length < limit && !usedJobs.has(key)) {
      picked.push(c);
      usedJobs.add(key);
      usedSources.add(c.source.id);
    }
  }
  for (const c of candidates) {
    if (picked.length >= limit) break;
    if (!picked.includes(c) && !usedSources.has(c.source.id)) {
      picked.push(c);
      usedSources.add(c.source.id);
    }
  }
  picked.sort((a, b) => b.score - a.score);

  return { hits: picked, detected: { companyIds, jobIds, topics } };
}

export class KeywordRetriever implements Retriever {
  async search(query: RetrievalQuery): Promise<RetrievalResult> {
    return searchSync(query);
  }
}
