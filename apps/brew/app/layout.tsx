import type { Metadata } from "next";
import { Fraunces, Newsreader, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const body = Newsreader({
  variable: "--font-body",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
});

const korean = Noto_Serif_KR({
  variable: "--font-korean",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "양조 · A Brewing Journal — Makgeolli, Cheongju & the Old Wines",
  description:
    "A working notebook for Korean rice wine: rescue a stuck brew, then scale the classical wines — 오양주, 삼해주, 석탄주. Change the rice or nuruk and every stage re-calculates.",
  openGraph: {
    title: "양조 · A Brewing Journal",
    description:
      "Rescue a thick brew, then scale the old wines — 오양주, 삼해주, 석탄주.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${korean.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
