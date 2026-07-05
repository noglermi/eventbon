import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eventBon Sales Terminal",
  description: "Simple voucher sales terminal for events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#f3f4ef] font-sans">{children}</body>
    </html>
  );
}
