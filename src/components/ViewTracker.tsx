"use client";
import { useEffect } from "react";
import { logEvent } from "@/lib/store";

type Props =
  | { type: "view_company"; companyId: string }
  | { type: "view_job" | "view_visit"; jobId: string; companyId: string };

/** ページ表示を「あなた」の行動ログに記録する */
export function ViewTracker(props: Props) {
  const key = JSON.stringify(props);
  useEffect(() => {
    logEvent(JSON.parse(key));
  }, [key]);
  return null;
}
