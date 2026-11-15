"use client";
// 企業マップ：横軸=採用人数（対数）、縦軸=採用競争力。色=入社後の成長タイプ。
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { companies } from "@/lib/data";
import { GROWTH_COLOR, GROWTH_DESC } from "@/lib/colors";
import { GROWTH_LABEL, QUADRANT_LABEL, type GrowthType } from "@/lib/types";

const W = 340;
const H = 300;
const M = { l: 30, r: 12, t: 14, b: 34 };
const X_MIN = Math.log10(5);
const X_MAX = Math.log10(1000);
const Y_MIN = 20;
const Y_MAX = 100;
// サーバーとクライアントで小数の文字列化がずれないよう 0.1 単位に丸める
const r1 = (v: number) => Math.round(v * 10) / 10;
const x = (n: number) => r1(M.l + ((Math.log10(n) - X_MIN) / (X_MAX - X_MIN)) * (W - M.l - M.r));
const y = (v: number) => r1(H - M.b - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - M.t - M.b));
/** 近接する企業のラベル位置の調整 */
const LABEL_POS: Record<string, "left" | "right" | "below"> = { miride: "below", hakuyo: "left", toho: "left" };
const SPLIT_X = 100;
const SPLIT_Y = 60;

export function CompanyMap() {
  const router = useRouter();
  const [active, setActive] = useState<Set<GrowthType>>(new Set(["early_ownership", "specialist", "structured"]));
  const [hover, setHover] = useState<string | null>(null);
  const toggle = (g: GrowthType) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(g) && next.size > 1) next.delete(g);
      else next.add(g);
      return next;
    });

  const hovered = companies.find((c) => c.id === hover);

  return (
    <div>
      {/* フィルタ兼凡例：色だけでなく文字ラベルで識別できる */}
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="入社後の成長タイプで絞り込む">
        {(Object.keys(GROWTH_LABEL) as GrowthType[]).map((g) => {
          const on = active.has(g);
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(g)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${on ? "border-neutral-300 bg-white text-neutral-900" : "border-transparent bg-neutral-100 text-neutral-400"}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: on ? GROWTH_COLOR[g] : "#c9c8c3" }} />
              {GROWTH_LABEL[g]}
              <span className="hidden text-[10px] text-neutral-500 sm:inline">{GROWTH_DESC[g]}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-manipulation select-none" role="img" aria-label="企業マップ（横軸：採用人数、縦軸：採用競争力）">
          {/* 象限の背景と名前 */}
          <rect x={x(SPLIT_X)} y={M.t} width={W - M.r - x(SPLIT_X)} height={y(SPLIT_Y) - M.t} fill="#f3f3f0" />
          <rect x={M.l} y={y(SPLIT_Y)} width={x(SPLIT_X) - M.l} height={H - M.b - y(SPLIT_Y)} fill="#f3f3f0" />
          <line x1={x(SPLIT_X)} x2={x(SPLIT_X)} y1={M.t} y2={H - M.b} stroke="#d6d5d0" strokeDasharray="3 3" />
          <line x1={M.l} x2={W - M.r} y1={y(SPLIT_Y)} y2={y(SPLIT_Y)} stroke="#d6d5d0" strokeDasharray="3 3" />
          {(
            [
              ["HL", M.l + 4, M.t + 11, "start"],
              ["HH", W - M.r - 4, M.t + 11, "end"],
              ["LL", M.l + 4, H - M.b - 6, "start"],
              ["LH", W - M.r - 4, H - M.b - 6, "end"],
            ] as const
          ).map(([q, qx, qy, anchor]) => (
            <text key={q} x={qx} y={qy} textAnchor={anchor} fontSize="9" fill="#898781">
              {QUADRANT_LABEL[q]}
            </text>
          ))}

          {/* 軸 */}
          <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="#bdbcb6" />
          <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} stroke="#bdbcb6" />
          {[10, 50, 100, 500].map((n) => (
            <text key={n} x={x(n)} y={H - M.b + 12} textAnchor="middle" fontSize="9" fill="#52514e">
              {n}
            </text>
          ))}
          {[40, 60, 80, 100].map((v) => (
            <text key={v} x={M.l - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#52514e">
              {v}
            </text>
          ))}
          <text x={(M.l + W - M.r) / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#52514e">
            新卒採用人数（人/年・対数）→
          </text>
          <text x={10} y={(M.t + H - M.b) / 2} textAnchor="middle" fontSize="10" fill="#52514e" transform={`rotate(-90 10 ${(M.t + H - M.b) / 2})`}>
            採用競争力 →
          </text>

          {/* 企業の点（ヒット領域は見た目より大きく） */}
          {companies.map((c) => {
            const on = active.has(c.growthType);
            const cx = x(c.hiringCount);
            const cy = y(c.competitiveness);
            const pos = LABEL_POS[c.id] ?? (cx > W - 90 ? "left" : "right");
            const lx = pos === "left" ? cx - 11 : pos === "right" ? cx + 11 : cx;
            const ly = pos === "below" ? cy + 19 : cy + 3.5;
            const anchor = pos === "left" ? "end" : pos === "right" ? "start" : "middle";
            return (
              <g
                key={c.id}
                role="link"
                tabIndex={on ? 0 : -1}
                aria-label={`${c.name}：採用${c.hiringCount}人、競争力${c.competitiveness}、${GROWTH_LABEL[c.growthType]}`}
                className={on ? "cursor-pointer" : "pointer-events-none"}
                opacity={on ? 1 : 0.15}
                onClick={() => router.push(`/companies/${c.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/companies/${c.id}`)}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.id)}
                onBlur={() => setHover(null)}
              >
                <circle cx={cx} cy={cy} r={16} fill="transparent" />
                <circle cx={cx} cy={cy} r={hover === c.id ? 8.5 : 7} fill={GROWTH_COLOR[c.growthType]} stroke="#fff" strokeWidth={2} />
                <text x={lx} y={ly} textAnchor={anchor} fontSize="10.5" fontWeight={600} fill="#0b0b0b">
                  {c.aliases[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-44 rounded-lg border border-black/10 bg-white p-2 text-xs shadow-lg"
            style={{
              left: `${Math.min(70, (x(hovered.hiringCount) / W) * 100)}%`,
              top: `${(y(hovered.competitiveness) / H) * 100 + 5}%`,
            }}
          >
            <p className="font-bold">{hovered.name}</p>
            <p className="text-neutral-600">{hovered.industryLabel}</p>
            <p className="mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: GROWTH_COLOR[hovered.growthType] }} />
              {GROWTH_LABEL[hovered.growthType]}
            </p>
            <p className="text-neutral-600">
              採用 {hovered.hiringCount}人／競争力 {hovered.competitiveness}
            </p>
          </div>
        )}
      </div>

      {/* 表形式（地図が読みにくい場合・スクリーンリーダー向け） */}
      <ul className="mt-3 divide-y divide-black/5 rounded-xl border border-black/5 bg-white">
        {companies
          .filter((c) => active.has(c.growthType))
          .map((c) => (
            <li key={c.id}>
              <Link href={`/companies/${c.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-neutral-50">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: GROWTH_COLOR[c.growthType] }} />
                <span className="flex-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-1.5 text-xs text-neutral-500">{c.industryLabel}</span>
                </span>
                <span className="text-[11px] text-neutral-500">{QUADRANT_LABEL[c.quadrant]}</span>
                <span aria-hidden className="text-neutral-400">›</span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
