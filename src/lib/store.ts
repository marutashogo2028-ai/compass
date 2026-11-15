"use client";
// デモ用の学生「あなた」の行動ログ。ブラウザの localStorage に保存する（本番ではサーバーに送る）。
import { useSyncExternalStore } from "react";
import type { Student, StudentEvent } from "./types";

const EVENTS_KEY = "compass:events:v1";
const HR_COMPANY_KEY = "compass:hrCompany";
const CHANGE = "compass:change";

const EMPTY: StudentEvent[] = [];
let cachedRaw: string | null = null;
let cachedEvents: StudentEvent[] = EMPTY;

function readEvents(): StudentEvent[] {
  const raw = localStorage.getItem(EVENTS_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedEvents = raw ? (JSON.parse(raw) as StudentEvent[]) : EMPTY;
    } catch {
      cachedEvents = EMPTY;
    }
  }
  return cachedEvents;
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE, cb);
    window.removeEventListener("storage", cb);
  };
}

function writeEvents(events: StudentEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(CHANGE));
}

export function useEvents(): StudentEvent[] {
  return useSyncExternalStore(subscribe, readEvents, () => EMPTY);
}

type NewEvent = StudentEvent extends infer E ? (E extends StudentEvent ? Omit<E, "ts"> : never) : never;

export function logEvent(e: NewEvent) {
  const events = readEvents();
  const now = new Date();
  // 開発モードの二重実行などで同じイベントが連続した場合は記録しない
  const last = events.at(-1);
  if (last && JSON.stringify({ ...last, ts: "" }) === JSON.stringify({ ...e, ts: "" }) && now.getTime() - Date.parse(last.ts) < 3000) return;
  writeEvents([...events, { ...e, ts: now.toISOString() } as StudentEvent]);
}

export function clearEvents() {
  writeEvents([]);
}

/** ダッシュボードの「サンプル履歴を読み込む」用 */
export function seedDemoEvents() {
  const base = Date.now() - 3 * 24 * 3600 * 1000;
  const t = (m: number) => new Date(base + m * 60000).toISOString();
  writeEvents([
    { type: "view_company", ts: t(0), companyId: "arclight" },
    { type: "view_job", ts: t(1), jobId: "j-arc", companyId: "arclight" },
    { type: "open_evidence", ts: t(3), jobId: "j-arc", companyId: "arclight" },
    { type: "ask", ts: t(5), question: "戦略コンサルの1年目は具体的に何をする？", status: "answered", jobId: "j-arc", companyId: "arclight" },
    { type: "ask", ts: t(7), question: "アークライトの年収はどれくらい？", status: "no_evidence", jobId: "j-arc", companyId: "arclight" },
    { type: "view_company", ts: t(20), companyId: "miride" },
    { type: "view_job", ts: t(21), jobId: "j-mit", companyId: "miride" },
    { type: "ask", ts: t(24), question: "ITコンサルにプログラミングスキルは必要？", status: "answered", jobId: "j-mit", companyId: "miride" },
    { type: "view_company", ts: t(40), companyId: "lumina" },
    { type: "view_job", ts: t(41), jobId: "j-lm", companyId: "lumina" },
    { type: "open_evidence", ts: t(42), jobId: "j-lm", companyId: "lumina" },
  ]);
}

export function getHrCompany(): string {
  return localStorage.getItem(HR_COMPANY_KEY) ?? "arclight";
}

export function useHrCompany(): string {
  return useSyncExternalStore(subscribe, getHrCompany, () => "arclight");
}

export function setHrCompany(id: string) {
  localStorage.setItem(HR_COMPANY_KEY, id);
  window.dispatchEvent(new Event(CHANGE));
}

/** 人事画面に「あなた」の行動も反映するための学生オブジェクト */
export function meAsStudent(events: StudentEvent[]): Student {
  return { id: "me", anonId: "あなた（デモ操作中）", grade: "学部3年", major: "—", interests: [], events };
}
