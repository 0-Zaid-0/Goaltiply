import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MultiPly — financial copilot",
  description:
    "An AI copilot that turns bank activity into a budget workbook and answers whether you can afford the next move.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
