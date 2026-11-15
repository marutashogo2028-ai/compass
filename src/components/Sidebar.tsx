"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { companies } from "@/lib/data";
import { setHrCompany, useHrCompany } from "@/lib/store";

const STUDENT_NAV = [
  { href: "/", label: "相談する", icon: "💬", match: (p: string) => p === "/" },
  { href: "/companies", label: "企業・職種を見る", icon: "🏢", match: (p: string) => p.startsWith("/companies") || p.startsWith("/jobs") || p.startsWith("/visit") },
];
const HR_NAV = [
  { href: "/hr", label: "学生インサイト", icon: "📊", match: (p: string) => p === "/hr" },
  { href: "/hr/students", label: "訪問意欲の高い学生", icon: "🙋", match: (p: string) => p.startsWith("/hr/students") },
];

export function Sidebar() {
  const pathname = usePathname();
  const isHr = pathname.startsWith("/hr");
  const hrCompany = useHrCompany();
  const nav = isHr ? HR_NAV : STUDENT_NAV;

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-black/5 bg-white px-3 py-4">
      <Link href={isHr ? "/hr" : "/"} className="mb-5 flex items-center gap-2 px-2">
        <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 font-bold text-white">
          ◎
        </span>
        <span>
          <span className="block font-bold leading-tight">コンパス</span>
          <span className="block text-[11px] text-neutral-500">仕事の解像度を上げる</span>
        </span>
      </Link>

      <div role="tablist" aria-label="表示モード" className="mb-4 grid grid-cols-2 rounded-lg bg-neutral-100 p-0.5 text-xs font-medium">
        <Link role="tab" aria-selected={!isHr} href="/" className={`rounded-md py-1.5 text-center ${!isHr ? "bg-white shadow-sm" : "text-neutral-500"}`}>
          学生
        </Link>
        <Link role="tab" aria-selected={isHr} href="/hr" className={`rounded-md py-1.5 text-center ${isHr ? "bg-white shadow-sm" : "text-neutral-500"}`}>
          企業人事
        </Link>
      </div>

      {isHr && (
        <label className="mb-4 block px-1 text-[11px] text-neutral-500">
          ログイン中の企業（デモ用）
          <select value={hrCompany} onChange={(e) => setHrCompany(e.target.value)} className="mt-1 block w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm font-bold text-neutral-900">
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <nav>
        <ul className="space-y-0.5">
          {nav.map((it) => {
            const active = it.match(pathname);
            return (
              <li key={it.href}>
                <Link href={it.href} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${active ? "bg-teal-50 font-bold text-teal-900" : "text-neutral-700 hover:bg-neutral-50"}`}>
                  <span aria-hidden>{it.icon}</span>
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-auto px-2 text-[11px] leading-relaxed text-neutral-400">
        回答はすべて、OB/OG訪問記録（本人同意済み）・社員プロフィール・企業公式コンテンツを根拠にしています。データは架空のデモ用です。
      </p>
    </aside>
  );
}
