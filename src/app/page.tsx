import { getJob } from "@/lib/data";
import { ChatClient } from "./ChatClient";

// モックデータはローカルにあり即時に描画できるため、URLパラメータ待ちのブロッキングを許可する
export const instant = false;

export default async function Home({ searchParams }: PageProps<"/">) {
  const { job } = await searchParams;
  const jobId = typeof job === "string" && getJob(job) ? job : undefined;
  // key を変えて、職種ページから来たときは新しい相談として始める
  return <ChatClient key={jobId ?? "new"} initialJobId={jobId} />;
}
