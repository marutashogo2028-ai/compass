"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STUDENT = [
  { href: "/", label: "企業マップ", icon: "▦", match: (p: string) => p === "/" || p.startsWith("/companies") || p.startsWith("/jobs") || p.startsWith("/visit") },
  { href: "/ask", label: "仕事Q&A", icon: "?", match: (p: string) => p.startsWith("/ask") },
  { href: "/dashboard", label: "解像度", icon: "◔", match: (p: string) => p.startsWith("/dashboard") },
];
const HR = [
  { href: "/hr", label: "学生インサイト", icon: "▤", match: (p: string) => p === "/hr" },
  { href: "/hr/students", label: "訪問意欲の高い学生", icon: "☺", match: (p: string) => p.startsWith("/hr/students") },
];

export function BottomNav() {
  const pathname = usePathname();
  const items = pathname.startsWith("/hr") ? HR : STUDENT;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-xl">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <li key={it.href} className="flex-1">
              <Link href={it.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-bold text-teal-800" : "text-neutral-500"}`}>
                <span aria-hidden className="text-lg leading-none">{it.icon}</span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
