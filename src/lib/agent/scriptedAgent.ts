// モック：シナリオとルールで逆質問を組み立てるエージェント
import { companies, getCompany, getJob, getSource, jobs } from "../data";
import type { AskResponse } from "../qa/types";
import type { GrowthType, Topic } from "../types";
import type { AgentTurn, InterviewAgent, QuickReply, QuickReplyAction, Stage, StudentProfile } from "./types";

export const INTERESTS = [
  { id: "consulting", label: "コンサル", jobIds: ["j-arc", "j-mit", "j-mib"] },
  { id: "finance", label: "金融・投資", jobIds: ["j-ng", "j-ski"] },
  { id: "trading", label: "商社", jobIds: ["j-skt", "j-ski"] },
  { id: "marketing", label: "広告・マーケ", jobIds: ["j-hk"] },
  { id: "startup", label: "スタートアップ", jobIds: ["j-lm", "j-ct"] },
  { id: "maker", label: "メーカー", jobIds: ["j-th"] },
];

const VALUES: { id: GrowthType; label: string }[] = [
  { id: "early_ownership", label: "若いうちから任されたい" },
  { id: "specialist", label: "専門性を身につけたい" },
  { id: "structured", label: "じっくり育ててほしい" },
];

const STAGES: { id: Stage; label: string }[] = [
  { id: "research", label: "業界研究を始めたところ" },
  { id: "visit", label: "OB/OG訪問をしてみたい" },
  { id: "selection", label: "選考が近い" },
];

export const FOCUSES: { id: string; label: string; query: string; topics: Topic[] }[] = [
  { id: "daily", label: "1日の流れ", query: "1日のスケジュールは？", topics: ["daily"] },
  { id: "year1", label: "1年目の仕事", query: "1年目は具体的に何をする？", topics: ["year1"] },
  { id: "career", label: "3〜5年目のキャリア", query: "3年目と5年目にはどんな仕事を任される？", topics: ["year3", "year5"] },
  { id: "skills", label: "必要なスキル", query: "必要なスキルは？", topics: ["skills"] },
  { id: "worklife", label: "働き方・雰囲気", query: "働き方やチームの雰囲気は？", topics: ["worklife", "culture"] },
];

const scopeLabel = (p: StudentProfile) => {
  if (p.jobIds.length === 1) {
    const j = getJob(p.jobIds[0])!;
    return `${getCompany(j.companyId)?.name}の${j.title}`;
  }
  return p.interestLabel ?? "気になる仕事";
};

const focusReplies = (p: StudentProfile): QuickReply[] =>
  FOCUSES.filter((f) => !f.topics.every((t) => p.coveredTopics.includes(t))).map((f) => ({ label: f.label, action: { type: "focus", id: f.id } }));

const askFocus = (p: StudentProfile, lead: string): AgentTurn => ({
  text: `${lead}${scopeLabel(p)}について、特に知りたいことはどれですか？自由に質問を書いてもOKです。`,
  quickReplies: focusReplies(p),
});

export class ScriptedInterviewAgent implements InterviewAgent {
  start(profile: StudentProfile): AgentTurn {
    if (profile.jobIds.length === 1) {
      return {
        text: `こんにちは！コンパスです。${scopeLabel(profile)}について、実際に働く人の記録をもとにお答えします。\nまず、今の就活の状況を教えてください。`,
        quickReplies: STAGES.map((s) => ({ label: s.label, action: { type: "stage", id: s.id } })),
      };
    }
    return {
      text: "こんにちは！コンパスです。OB/OG訪問の記録や社員プロフィールなど、実際に働く人の情報だけをもとに、仕事の中身を一緒に見ていきます。\nはじめに、気になっている業界や職種はありますか？",
      quickReplies: [...INTERESTS.map((i) => ({ label: i.label, action: { type: "interest", id: i.id } as QuickReplyAction })), { label: "まだ決まっていない", action: { type: "interest", id: "undecided" } }],
    };
  }

  onQuickReply(profile: StudentProfile, action: QuickReplyAction): { profile: StudentProfile; turn: AgentTurn } {
    switch (action.type) {
      case "interest": {
        if (action.id === "undecided") {
          return {
            profile,
            turn: {
              text: "大丈夫です、そこから一緒に考えましょう。仕事を選ぶうえで、いちばん大事にしたいことに近いのはどれですか？",
              quickReplies: VALUES.map((v) => ({ label: v.label, action: { type: "value", id: v.id } })),
            },
          };
        }
        const it = INTERESTS.find((i) => i.id === action.id)!;
        const next = { ...profile, interestLabel: it.label, jobIds: it.jobIds };
        return { profile: next, turn: { text: `${it.label}ですね。今の就活の状況はどれに近いですか？`, quickReplies: STAGES.map((s) => ({ label: s.label, action: { type: "stage", id: s.id } })) } };
      }
      case "value": {
        const v = VALUES.find((x) => x.id === action.id)!;
        const matched = companies.filter((c) => c.growthType === action.id);
        const jobIds = jobs.filter((j) => matched.some((c) => c.id === j.companyId)).map((j) => j.id);
        const next = { ...profile, interestLabel: `「${v.label}」に合う仕事`, jobIds };
        return {
          profile: next,
          turn: {
            text: `「${v.label}」という観点だと、${matched.map((c) => c.name).join("、")}が当てはまります（各社の育成についての記録より）。\n今の就活の状況はどれに近いですか？`,
            quickReplies: STAGES.map((s) => ({ label: s.label, action: { type: "stage", id: s.id } })),
          },
        };
      }
      case "stage": {
        const next = { ...profile, stage: action.id };
        const lead =
          action.id === "visit"
            ? "OB/OG訪問の準備ですね。聞くべきことを絞るために、まず仕事の中身を押さえましょう。"
            : action.id === "selection"
              ? "選考が近いんですね。入社後の具体的な仕事を知っておくと、志望動機に説得力が出ます。"
              : "いいタイミングです。";
        return { profile: next, turn: askFocus(next, lead) };
      }
      case "focus": {
        const f = FOCUSES.find((x) => x.id === action.id)!;
        const next = { ...profile, focus: f.label };
        return { profile: next, turn: { text: `${scopeLabel(next)}の「${f.label}」について、ソースを調べます。`, ask: { text: f.query } } };
      }
      case "job": {
        const next = { ...profile, jobIds: [action.jobId] };
        return { profile: next, turn: askFocus(next, "") };
      }
      case "ask":
        return { profile, turn: { text: "", ask: { text: action.text } } };
      case "visit":
        return {
          profile,
          turn: {
            text: "右の「あなたへのOB/OG提案」に、話を聞くとよい人と、その理由・聞くとよい質問をまとめました。気になる人がいれば「訪問を依頼する」を押してください。\nほかに確かめておきたいことはありますか？",
            quickReplies: focusReplies(profile),
          },
        };
    }
  }

  followUp(profile: StudentProfile, answer: AskResponse): AgentTurn {
    const visit: QuickReply = { label: "OB/OGに聞きたい", action: { type: "visit" } };
    if (answer.status === "no_evidence") {
      return {
        text: "これは公開されている記録では分からないことでした。OB/OG訪問で直接聞く価値がある質問です。右側に、聞けそうな人を出しました。\n代わりに、記録で確かめられることを見てみますか？",
        quickReplies: [...focusReplies(profile).slice(0, 3), visit],
      };
    }
    // 回答が複数の会社にまたがったら、どこを深掘りするか逆質問する
    const answeredJobs = [...new Set(answer.citations.map((c) => getSource(c.sourceId)?.jobId).filter((id): id is string => !!id))].map((id) => getJob(id)!);
    if (answeredJobs.length > 1) {
      return {
        text: "会社によって中身がかなり違いますね。この中で、いちばん気になったのはどれですか？",
        quickReplies: [...answeredJobs.map((j) => ({ label: `${getCompany(j.companyId)?.name}／${j.title}`, action: { type: "job", jobId: j.id } as QuickReplyAction })), visit],
      };
    }
    const remaining = focusReplies(profile);
    return {
      text: remaining.length
        ? "イメージは具体的になりましたか？ 続けて、ほかの面も見ておきましょう。どれが気になりますか？"
        : "主な面はひと通り見られました。ここから先は、本人に聞かないと分からないことです。OB/OG訪問の準備をしましょう。",
      quickReplies: [...remaining.slice(0, 3), visit],
    };
  }
}

export const emptyProfile = (jobId?: string): StudentProfile => ({ jobIds: jobId ? [jobId] : [], coveredTopics: [] });
