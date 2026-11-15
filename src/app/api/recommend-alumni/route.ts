// 相談内容に合わせて「話を聞くとよいOB/OG」を理由・質問つきで返す
import { alumniRecommender } from "@/lib/qa";
import type { RecommendContext } from "@/lib/qa/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RecommendContext>;
  const arr = <T,>(v: unknown, n: number) => (Array.isArray(v) ? (v.slice(-n) as T[]) : []);
  const recommendations = await alumniRecommender.recommend({
    jobIds: arr<string>(body.jobIds, 10),
    focusTopics: arr(body.focusTopics, 10),
    citedSourceIds: arr<string>(body.citedSourceIds, 30),
    events: arr(body.events, 500),
  });
  return Response.json({ recommendations });
}
