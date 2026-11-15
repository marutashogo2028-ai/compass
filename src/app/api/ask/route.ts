// 仕事Q&A のエンドポイント。回答生成はサーバー側で行う（本物のLLMに替えてもAPIキーがブラウザに出ない）
import { ask } from "@/lib/qa";
import type { AskRequest } from "@/lib/qa/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AskRequest>;
  const text = (body.text ?? "").trim();
  if (!text) return Response.json({ error: "質問を入力してください" }, { status: 400 });
  if (text.length > 300) return Response.json({ error: "質問は300文字以内にしてください" }, { status: 400 });

  const res = await ask({
    text,
    companyId: body.companyId || undefined,
    jobId: body.jobId || undefined,
    recentJobIds: Array.isArray(body.recentJobIds) ? body.recentJobIds.slice(0, 10) : undefined,
  });
  return Response.json(res);
}
