import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { isClerkConfigured } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TabShelf",
  description: "Find guitar tabs and keep them on a bookshelf of albums.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerkEnabled = isClerkConfigured();
  const tree = (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col bg-background text-foreground">
        <Nav clerkEnabled={clerkEnabled} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </body>
    </html>
  );

  if (clerkEnabled) {
    return <ClerkProvider>{tree}</ClerkProvider>;
  }

  return tree;
}
