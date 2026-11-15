import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "コンパス｜仕事の解像度を上げる",
  description: "根拠つきで仕事の中身を知り、目的のはっきりしたOB/OG訪問へ。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <Header />
        <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-4">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
