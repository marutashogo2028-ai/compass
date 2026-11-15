// ============================================================
// チャットエージェント（逆質問）のインターフェース
//   モック : ScriptedInterviewAgent（シナリオ＋ルール）
//   本番例 : LLM で次の逆質問を生成する実装（サーバー側に置く）
// 仕事に関する「回答」は必ず /api/ask（根拠つき）を通す。エージェントは聞き方を決めるだけ。
// ============================================================
import type { AskResponse } from "../qa/types";
import type { Topic } from "../types";

export type Stage = "research" | "visit" | "selection";

export interface StudentProfile {
  interestLabel?: string;
  /** 相談の対象にする職種（質問文で企業・職種が特定できないときの範囲） */
  jobIds: string[];
  stage?: Stage;
  focus?: string;
  /** これまでに回答で扱ったトピック（次の逆質問の重複を避ける） */
  coveredTopics: Topic[];
}

export type QuickReplyAction =
  | { type: "interest"; id: string }
  | { type: "value"; id: string }
  | { type: "stage"; id: Stage }
  | { type: "focus"; id: string }
  | { type: "job"; jobId: string }
  | { type: "ask"; text: string }
  | { type: "visit" };

export interface QuickReply {
  label: string;
  action: QuickReplyAction;
}

export interface AgentTurn {
  text: string;
  quickReplies?: QuickReply[];
  /** この返答で /api/ask に投げる質問（あれば） */
  ask?: { text: string };
}

export interface InterviewAgent {
  /** チャットを開いたときの最初の逆質問 */
  start(profile: StudentProfile): AgentTurn;
  /** 選択肢が押されたときの次の一手（プロフィールの更新と次の発話） */
  onQuickReply(profile: StudentProfile, action: QuickReplyAction): { profile: StudentProfile; turn: AgentTurn };
  /** 根拠つき回答のあとに続ける逆質問 */
  followUp(profile: StudentProfile, answer: AskResponse): AgentTurn;
}
