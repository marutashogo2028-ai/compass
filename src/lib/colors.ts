import type { GrowthType } from "./types";

/** 成長タイプの色（dataviz リファレンスパレットの slot 1〜3。CSS変数は globals.css） */
export const GROWTH_COLOR: Record<GrowthType, string> = {
  early_ownership: "var(--series-1)",
  specialist: "var(--series-2)",
  structured: "var(--series-3)",
};

export const GROWTH_DESC: Record<GrowthType, string> = {
  early_ownership: "若手から大きな裁量",
  specialist: "専門領域を深く",
  structured: "研修・ローテで段階的に",
};
