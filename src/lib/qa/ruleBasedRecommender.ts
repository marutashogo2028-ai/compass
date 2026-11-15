// モック：相談内容とソースから「話を聞くとよいOB/OG」を理由つきで選ぶ
import { alumni, getJob, sources } from "../data";
import { TOPIC_LABEL } from "./dictionary";
import type { AlumniRecommendation, AlumniRecommender, RecommendContext, VisitQuestion, VisitQuestionSuggester } from "./types";

const CURRENT_YEAR = 2026;

export class RuleBasedRecommender implements AlumniRecommender {
  constructor(private suggester: VisitQuestionSuggester) {}

  async recommend(ctx: RecommendContext): Promise<AlumniRecommendation[]> {
    const pool = ctx.jobIds.length ? alumni.filter((a) => ctx.jobIds.includes(a.jobId)) : alumni;
    const unanswered = ctx.events.filter((e) => e.type === "ask" && e.status === "no_evidence") as Extract<(typeof ctx.events)[number], { type: "ask" }>[];

    const scored = pool.map((a) => {
      const job = getJob(a.jobId)!;
      const mySources = sources.filter((s) => s.author.alumniId === a.id);
      const myTopics = new Set(mySources.flatMap((s) => s.passages.flatMap((p) => p.topics)));
      const years = CURRENT_YEAR - a.joinYear + 1; // 今年で入社何年目か
      const reasons: string[] = [];
      let score = 0;

      const cited = mySources.filter((s) => ctx.citedSourceIds.includes(s.id)).map((s) => s.id);
      if (cited.length) {
        score += 4;
        reasons.push("さっきの回答で引用した記録を書いた本人です。書かれていない背景まで聞けます。");
      }

      const topicHits = ctx.focusTopics.filter((t) => myTopics.has(t));
      if (topicHits.length) {
        score += 2;
        reasons.push(`あなたが知りたい「${topicHits.map((t) => TOPIC_LABEL[t]).join("・")}」について、訪問記録やプロフィールで話しています。`);
      }

      if (ctx.focusTopics.includes("year1") && years <= 3) {
        score += 2;
        reasons.push(`入社${years}年目で、1年目の経験が新しい人です。`);
      }
      if (ctx.focusTopics.some((t) => t === "year3" || t === "year5" || t === "career") && years >= 5) {
        score += 2;
        reasons.push(`入社${years}年目。3年目・5年目にどう仕事が変わったかを実体験で話せます。`);
      }

      const relatedUnanswered = unanswered.filter((e) => e.jobId === a.jobId || (!e.jobId && e.companyId === a.companyId));
      if (relatedUnanswered.length) {
        score += 2;
        reasons.push(`公開情報で答えられなかった「${relatedUnanswered.at(-1)!.question}」を直接聞ける会社の人です。`);
      }

      if (reasons.length === 0) reasons.push(`${job.title}として働く${a.joinYear}年入社の社員です。`);
      return { a, score, reasons, cited, years, relatedUnanswered, myTopics };
    });

    scored.sort((x, y) => y.score - x.score || y.a.joinYear - x.a.joinYear);
    const top = scored.slice(0, 3);

    return Promise.all(
      top.map(async ({ a, reasons, cited, years, relatedUnanswered }) => {
        const personal: VisitQuestion[] = [];
        for (const e of relatedUnanswered.slice(-1)) personal.push({ question: e.question, reason: "公開情報に根拠がなかった、あなたの質問です。" });
        if (ctx.focusTopics.includes("year1") || years <= 3) {
          personal.push({
            question: `入社1年目で任された仕事のうち、いちばん大変だったことと、どう乗り越えたかを教えてください。`,
            reason: years <= 3 ? `${a.displayName}は入社${years}年目。記憶が新しいうちに聞ける話です。` : `入社${years}年目の${a.displayName}なら、1年目の苦労が今どう生きているかまで話せます。`,
          });
        } else {
          personal.push({
            question: `入社3年目と5年目で、任される仕事や見える景色はどう変わりましたか？`,
            reason: `入社${years}年目の${a.displayName}なら、変化を実体験で話せます。`,
          });
        }
        const jobQs = await this.suggester.suggest({ jobId: a.jobId, events: ctx.events });
        // まだその年次に達していない人に「5年目は？」と聞かないようにする
        const fitsTenure = (q: VisitQuestion) => !((/5年目/.test(q.question) && years < 5) || (/3年目/.test(q.question) && years < 3));
        const questions = [...personal, ...jobQs.filter(fitsTenure)].filter((q, i, arr) => arr.findIndex((x) => x.question === q.question) === i).slice(0, 3);
        return { alumni: a, reasons: reasons.slice(0, 3), questions, citedSourceIds: cited };
      }),
    );
  }
}
