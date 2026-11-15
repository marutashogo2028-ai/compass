"use client";
import { companies } from "@/lib/data";
import { setHrCompany, useHrCompany } from "@/lib/store";

export function HrCompanySelect() {
  const companyId = useHrCompany();
  return (
    <label className="block rounded-2xl border border-black/5 bg-neutral-900 p-3 text-xs text-neutral-300">
      ログイン中の企業（デモ用に切り替え可）
      <select
        value={companyId}
        onChange={(e) => setHrCompany(e.target.value)}
        className="mt-1 block w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm font-bold text-white"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} 人事部
          </option>
        ))}
      </select>
    </label>
  );
}
