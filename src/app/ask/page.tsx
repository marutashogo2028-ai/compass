import { redirect } from "next/navigation";

// 旧URL（/ask）はチャット画面へ
export const instant = false;

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const { job } = await searchParams;
  redirect(typeof job === "string" ? `/?job=${encodeURIComponent(job)}` : "/");
}
