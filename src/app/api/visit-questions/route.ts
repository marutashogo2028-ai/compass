// OB/OG訪問で「聞くとよいこと」を返すエンドポイント
import { visitSuggester } from "@/lib/qa";
import type { StudentEvent } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { jobId?: string; events?: StudentEvent[] };
  if (!body.jobId) return Response.json({ error: "jobId が必要です" }, { status: 400 });
  const events = Array.isArray(body.events) ? body.events.slice(-500) : [];
  const questions = await visitSuggester.suggest({ jobId: body.jobId, events });
  return Response.json({ questions });
}
