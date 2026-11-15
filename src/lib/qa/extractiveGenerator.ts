// モック生成：検索で得たパッセージをそのまま引用して回答を組み立てる。
// LLMの事前知識は一切使わない。本番では Claude API などに差し替える（README参照）。
import { getCompany, getJob } from "../data";
import { TOPIC_LABEL } from "./dictionary";
import type { AnswerGenerator, AnswerSegment, Citation, GeneratedAnswer, RetrievalResult } from "./types";

export class ExtractiveGenerator implements AnswerGenerator {
  async generate({ retrieval }: { question: string; retrieval: RetrievalResult }): Promise<GeneratedAnswer> {
    const { hits, detected } = retrieval;

    if (hits.length === 0) {
      const labels = detected.topics.filter((t) => t !== "duties").map((t) => TOPIC_LABEL[t]);
      return {
        status: "no_evidence",
        citations: [],
        segments: [
          { text: "情報がありません。この質問に答えられる根拠（OB/OG訪問記録・社員プロフィール・公式コンテンツ）が見つからなかったため、推測での回答は控えます。", citationIds: [] },
          ...(labels.length ? [{ text: `「${labels.join("・")}」に関する公開情報は、まだ登録されていません。`, citationIds: [] }] : []),
          { text: "下のOB/OGに直接聞いてみましょう。", citationIds: [] },
        ],
      };
    }

    const citations: Citation[] = hits.map((h, i) => ({
      id: String(i + 1),
      passageId: h.passage.id,
      sourceId: h.source.id,
      sourceType: h.source.type,
      sourceTitle: h.source.title,
      companyId: h.source.companyId,
      companyName: getCompany(h.source.companyId)?.name ?? h.source.companyId,
      jobTitle: h.source.jobTitle,
      authorName: h.source.author.displayName,
      joinYear: h.source.author.joinYear,
      date: h.source.date,
      quote: h.passage.text,
    }));

    const jobIds = [...new Set(hits.map((h) => h.source.jobId))];
    const multiJob = jobIds.length > 1;
    const single = !multiJob && jobIds[0] ? getJob(jobIds[0]) : undefined;
    const intro = single
      ? `${getCompany(single.companyId)?.name}の${single.title}について、${hits.length}件のソースをもとに回答します。`
      : `${hits.length}件のソースをもとに回答します（職種ごとに異なります）。`;

    const segments: AnswerSegment[] = [
      { text: intro, citationIds: [] },
      ...citations.map((c) => ({
        text: `${multiJob ? `【${c.companyName}・${c.jobTitle}】` : ""}${c.quote}`,
        citationIds: [c.id],
      })),
      { text: "※ ソースに書かれている内容だけを表示しています。自分に当てはまるかはOB/OG訪問で確かめましょう。", citationIds: [] },
    ];

    return { status: "answered", segments, citations };
  }
}
