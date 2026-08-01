import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://northstar-visionx.vijaymadu.chatgpt.site"),
  title: "Northstar — Startup Operating System",
  description: "One intelligent command center for your startup's goals, growth, team, and runway.",
  openGraph: {
    title: "Northstar — Startup Operating System",
    description: "The operating system for ambitious startups.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Northstar — Startup Operating System",
    description: "The operating system for ambitious startups.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
