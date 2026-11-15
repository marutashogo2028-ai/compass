import { AskClient } from "./AskClient";

// モックデータはローカルにあり即時に描画できるため、URLパラメータ待ちのブロッキングを許可する
export const instant = false;

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const { job } = await searchParams;
  return <AskClient initialJobId={typeof job === "string" ? job : ""} />;
}
