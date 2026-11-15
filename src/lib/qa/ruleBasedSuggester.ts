// モック：OB/OG訪問で「この人に聞くとよいこと」を3つ組み立てる。
// 優先順位：①根拠がなく答えられなかった自分の質問 → ②公開情報がないトピック → ③根拠が薄い年次 → ④本人にしか語れない定番
import { getJob, sourcesOfJob } from "../data";
import type { StudentEvent, Topic } from "../types";
import { TOPIC_LABEL } from "./dictionary";
import type { VisitQuestion, VisitQuestionSuggester } from "./types";

const GAP_TEMPLATES: Partial<Record<Topic, string>> = {
  year5: "5年目にはどんな役割を任されていますか？そこに至るまでの転機は何でしたか？",
  worklife: "繁忙期と落ち着いた時期で、働き方はどれくらい変わりますか？",
  culture: "チームの雰囲気や、上司・先輩との関わり方を教えてください。",
  career: "この仕事の経験は、その後どんなキャリアにつながっていますか？",
  daily: "直近の1週間はどんな予定で動いていましたか？",
  skills: "入社後に一番伸びたスキルと、伸ばすためにしたことは何ですか？",
};

const YEAR_TEMPLATES = {
  year1: "1年目で一番苦労した仕事と、それをどう乗り越えたかを教えてください。",
  year3: "3年目で任された仕事のうち、一番成長につながったものは何ですか？",
  year5: GAP_TEMPLATES.year5!,
};

export class RuleBasedSuggester implements VisitQuestionSuggester {
  async suggest({ jobId, events }: { jobId: string; events: StudentEvent[] }): Promise<VisitQuestion[]> {
    const job = getJob(jobId);
    if (!job) return [];
    const out: VisitQuestion[] = [];
    const push = (q: VisitQuestion) => {
      if (out.length < 3 && !out.some((o) => o.question === q.question)) out.push(q);
    };

    // ① 自分が聞いて答えられなかった質問
    for (const e of [...events].reverse()) {
      if (e.type === "ask" && e.status === "no_evidence" && (e.jobId === jobId || (!e.jobId && e.companyId === job.companyId))) {
        push({ question: e.question, reason: "あなたがコンパスで質問したものの、公開情報に根拠がなかった質問です。" });
      }
    }

    // ② この職種のソースに一度も出てこないトピック
    const covered = new Set(sourcesOfJob(jobId).flatMap((s) => s.passages.flatMap((p) => p.topics)));
    for (const t of Object.keys(GAP_TEMPLATES) as Topic[]) {
      if (!covered.has(t)) push({ question: GAP_TEMPLATES[t]!, reason: `この職種の「${TOPIC_LABEL[t]}」については公開情報がありません。` });
    }

    // ③ 根拠が1つのソースにしかない年次
    for (const y of ["year1", "year3", "year5"] as const) {
      const srcs = new Set(job.byYear[y].flatMap((c) => c.evidence.map((p) => p.split("#")[0])));
      if (srcs.size === 1) push({ question: YEAR_TEMPLATES[y], reason: `${TOPIC_LABEL[y]}の情報は1件のソースだけ。別の人の視点でも確かめましょう。` });
    }

    // ④ 本人にしか語れない定番
    push({ question: "入社前のイメージと、実際の1年目の仕事で一番違ったことは何ですか？", reason: "公開情報は「何をするか」が中心。ギャップは本人にしか語れません。" });
    push({ question: `${job.title}として活躍している人に共通する行動は何ですか？`, reason: "スキル一覧だけでは分からない、日々の行動レベルの話を聞けます。" });
    push({ question: "学生のうちにやっておけばよかったと思うことは何ですか？", reason: "今日からの準備に直結します。" });

    return out;
  }
}
