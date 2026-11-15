"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlumniPanel } from "@/components/AlumniPanel";
import { EvidenceSheet } from "@/components/EvidenceBadges";
import { SourceTypeTag, formatDate, yearLabel } from "@/components/ui";
import { ScriptedInterviewAgent, emptyProfile } from "@/lib/agent/scriptedAgent";
import type { AgentTurn, InterviewAgent, QuickReply, StudentProfile } from "@/lib/agent/types";
import { getCompany, getJob } from "@/lib/data";
import type { AskResponse } from "@/lib/qa/types";
import { logEvent } from "@/lib/store";

const agent: InterviewAgent = new ScriptedInterviewAgent();

type Msg = { id: number; role: "agent" | "user"; text?: string; answer?: AskResponse; quickReplies?: QuickReply[]; error?: string };

let seq = 0;
const nextId = () => ++seq;

export function ChatClient({ initialJobId }: { initialJobId?: string }) {
  const [profile, setProfile] = useState<StudentProfile>(() => emptyProfile(initialJobId));
  const [messages, setMessages] = useState<Msg[]>(() => {
    const t = agent.start(emptyProfile(initialJobId));
    return [{ id: nextId(), role: "agent", text: t.text, quickReplies: t.quickReplies }];
  });
  const [cited, setCited] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const push = (...m: Omit<Msg, "id">[]) => setMessages((prev) => [...prev, ...m.map((x) => ({ ...x, id: nextId() }))]);

  async function runAsk(question: string, p: StudentProfile) {
    setLoading(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question, scopeJobIds: p.jobIds }),
      });
      const res = (await r.json()) as AskResponse & { error?: string };
      if (!r.ok) throw new Error(res.error ?? "エラーが発生しました");

      // 根拠つきで答えられたトピックだけを「見たこと」に加える
      const learned = res.status === "answered" ? res.detected.topics.filter((t) => t !== "duties") : [];
      const next: StudentProfile = { ...p, coveredTopics: [...new Set([...p.coveredTopics, ...learned])] };
      setProfile(next);
      setCited((c) => [...new Set([...c, ...res.citations.map((x) => x.sourceId)])]);

      const loggedJob = res.detected.jobIds.length === 1 ? res.detected.jobIds[0] : undefined;
      const loggedCompany = loggedJob ? getJob(loggedJob)?.companyId : res.detected.companyIds.length === 1 ? res.detected.companyIds[0] : undefined;
      logEvent({ type: "ask", question, status: res.status, jobId: loggedJob, companyId: loggedCompany });

      const f = agent.followUp(next, res);
      push({ role: "agent", answer: res }, { role: "agent", text: f.text, quickReplies: f.quickReplies });
    } catch (e) {
      push({ role: "agent", error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  function playTurn(turn: AgentTurn, p: StudentProfile) {
    if (turn.text) push({ role: "agent", text: turn.text, quickReplies: turn.ask ? undefined : turn.quickReplies });
    if (turn.ask) void runAsk(turn.ask.text, p);
  }

  function onQuick(q: QuickReply) {
    if (loading) return;
    push({ role: "user", text: q.label });
    const { profile: p, turn } = agent.onQuickReply(profile, q.action);
    setProfile(p);
    playTurn(turn, p);
  }

  function reset() {
    const p = emptyProfile();
    const t = agent.start(p);
    setProfile(p);
    setCited([]);
    setMessages([{ id: nextId(), role: "agent", text: t.text, quickReplies: t.quickReplies }]);
  }

  function onSubmit() {
    const q = text.trim();
    if (!q || loading) return;
    setText("");
    push({ role: "user", text: q });
    void runAsk(q, profile);
  }

  const lastAgentWithReplies = [...messages].reverse().find((m) => m.role === "agent" && m.quickReplies?.length)?.id;
  const scopeJob = profile.jobIds.length === 1 ? getJob(profile.jobIds[0]) : undefined;

  return (
    <div className="grid h-screen grid-cols-[minmax(0,1fr)_400px]">
      {/* チャット */}
      <section className="flex min-h-0 flex-col bg-[#f6f6f4]">
        <header className="flex items-center justify-between gap-4 border-b border-black/5 bg-white px-8 py-3">
          <div className="min-w-0">
            <h1 className="font-bold">仕事の相談</h1>
            <p className="truncate text-xs text-neutral-500">
              {scopeJob
                ? `相談中：${getCompany(scopeJob.companyId)?.name}／${scopeJob.title}`
                : profile.interestLabel
                  ? `相談中：${profile.interestLabel}`
                  : "根拠のある情報だけで答えます。根拠がないことは「情報がありません」と伝えます。"}
            </p>
          </div>
          {initialJobId ? (
            <Link href="/" className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-neutral-50">
              ＋ 新しい相談
            </Link>
          ) : (
            <button type="button" onClick={reset} disabled={loading} className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs hover:bg-neutral-50">
              ＋ 新しい相談
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="ml-auto w-fit max-w-[75%] rounded-2xl rounded-br-sm bg-teal-700 px-4 py-2 text-sm text-white">
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <span aria-hidden className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">
                    ◎
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    {m.text && <p className="whitespace-pre-line text-sm leading-relaxed">{m.text}</p>}
                    {m.error && <p className="text-sm text-red-700">{m.error}</p>}
                    {m.answer && <Answer res={m.answer} onOpen={setSheet} />}
                    {m.quickReplies && m.id === lastAgentWithReplies && !loading && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {m.quickReplies.map((q) => (
                          <button
                            key={`${q.label}-${q.action.type}`}
                            onClick={() => onQuick(q)}
                            className="rounded-full border border-teal-700/30 bg-white px-3.5 py-1.5 text-sm text-teal-900 hover:border-teal-700 hover:bg-teal-50"
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {loading && <p className="pl-11 text-sm text-neutral-500">ソースを検索しています…</p>}
            <div ref={bottom} />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="border-t border-black/5 bg-white px-8 py-4"
        >
          <div className="mx-auto flex max-w-3xl gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm focus-within:border-teal-700/50">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="自由に質問できます（例：ITコンサルにプログラミングは必要？）"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
              maxLength={300}
            />
            <button disabled={loading || !text.trim()} className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-bold text-white disabled:bg-neutral-300">
              送信
            </button>
          </div>
        </form>
      </section>

      {/* 右パネル：OB/OGの具体的な提案 */}
      <AlumniPanel profile={profile} citedSourceIds={cited} />

      {sheet && <EvidenceSheet passageId={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Answer({ res, onOpen }: { res: AskResponse; onOpen: (passageId: string) => void }) {
  const noEvidence = res.status === "no_evidence";
  return (
    <div className="animate-fade-up space-y-2">
      <div className={`rounded-2xl rounded-tl-sm border p-4 text-sm leading-relaxed ${noEvidence ? "border-amber-300 bg-amber-50" : "border-black/5 bg-white"}`}>
        {noEvidence && <p className="mb-1 text-xs font-bold text-amber-900">⚠ 根拠なし</p>}
        {res.segments.map((s, i) => (
          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
            {s.text}
            {s.citationIds.map((c) => (
              <button key={c} onClick={() => onOpen(res.citations.find((x) => x.id === c)!.passageId)} className="ml-0.5 align-super text-[10px] font-bold text-teal-800 hover:underline">
                [{c}]
              </button>
            ))}
          </p>
        ))}
      </div>
      {res.citations.length > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {res.citations.map((c) => (
            <button key={c.id} onClick={() => onOpen(c.passageId)} className="rounded-xl border border-black/5 bg-white p-2.5 text-left hover:border-teal-700/30">
              <span className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-teal-800">[{c.id}]</span>
                <SourceTypeTag type={c.sourceType} />
              </span>
              <span className="mt-1 block truncate text-xs text-neutral-700">
                {c.companyName}／{c.jobTitle}
              </span>
              <span className="block text-[11px] text-neutral-500">
                {c.authorName}・{yearLabel(c.joinYear)}・{formatDate(c.date)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
