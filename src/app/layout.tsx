import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AVAULT — A vault for judgment",
    template: "%s | AVAULT",
  },
  description:
    "Daily political-ethical verdicts on the day's biggest news. One named author, one owned judgment, one concrete intervention. By Wonwoo Yoon.",
  alternates: {
    types: { "application/rss+xml": `${siteUrl}/rss.xml` },
  },
  openGraph: {
    siteName: "AVAULT",
    type: "website",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
