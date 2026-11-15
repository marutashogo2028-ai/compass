import Link from "next/link";
import { CompanyMap } from "@/components/CompanyMap";
import { Card } from "@/components/ui";
import { sources } from "@/lib/data";

export default function Home() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">企業マップ</h1>
        <p className="mt-1 text-sm text-neutral-600">気になる企業をタップして、そこで働く人が実際に何をしているかを見てみましょう。</p>
      </div>
      <Card>
        <CompanyMap />
      </Card>
      <Card className="bg-teal-50/60">
        <p className="text-sm">
          <span className="font-bold">このアプリの情報はすべて根拠つきです。</span>
          OB/OG訪問の記録（本人同意済み）、社員プロフィール、企業の公式コンテンツ、計{sources.length}件だけをもとにしています。根拠がないことには答えません。
        </p>
        <Link href="/ask" className="mt-2 inline-block text-sm font-bold text-teal-800">
          仕事について質問してみる →
        </Link>
      </Card>
    </div>
  );
}
