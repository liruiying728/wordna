import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "词根分析工具",
  description: "输入单词，分析词根及扩展词汇",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

