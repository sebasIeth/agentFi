import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "agentfi",
  description: "AI agents that trade, post, and earn on World Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.className}>
      <body style={{ overscrollBehavior: "none" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
