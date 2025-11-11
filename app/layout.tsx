import type { Metadata } from "next";
import "@/app/globals.css";
import AmapLoader from '@/components/AmapLoader'

export const metadata: Metadata = {
  title: "AI Travel Planner",
  description: "智能旅行规划助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <AmapLoader />
        {children}
      </body>
    </html>
  );
}