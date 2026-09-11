import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MultiPly — your financial copilot",
  description:
    "Real-time, automated financial guidance for young adults. Connect your accounts, ask real questions, get real answers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
