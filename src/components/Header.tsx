"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isHr = pathname.startsWith("/hr");
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2.5">
        <Link href={isHr ? "/hr" : "/"} className="flex items-center gap-1.5">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">
            ◎
          </span>
          <span className="font-bold tracking-wide">コンパス</span>
          <span className="hidden text-[11px] text-neutral-500 sm:inline">仕事の解像度を上げる</span>
        </Link>
        <div role="tablist" aria-label="表示モード" className="flex rounded-full bg-neutral-100 p-0.5 text-xs font-medium">
          <Link role="tab" aria-selected={!isHr} href="/" className={`rounded-full px-3 py-1.5 ${!isHr ? "bg-white shadow-sm" : "text-neutral-500"}`}>
            学生
          </Link>
          <Link role="tab" aria-selected={isHr} href="/hr" className={`rounded-full px-3 py-1.5 ${isHr ? "bg-white shadow-sm" : "text-neutral-500"}`}>
            企業人事
          </Link>
        </div>
      </div>
    </header>
  );
}
