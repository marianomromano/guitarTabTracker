import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { NowPlaying } from "@/components/now-playing";
import { PlayerProvider } from "@/components/player-provider";
import { getSession } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TabShelf",
  description: "Find guitar tabs and keep them on a bookshelf of albums.",
  referrer: "origin",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col bg-background text-foreground">
        <Script
          src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"
          strategy="afterInteractive"
          data-web-components=""
        />
        <PlayerProvider>
          <Nav isSignedIn={session.isSignedIn} isDemo={session.isDemo} />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
          <NowPlaying />
        </PlayerProvider>
      </body>
    </html>
  );
}
