import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import SessionRoleSync from "@/components/shared/SessionRoleSync";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Robocode IT Academy",
  description: "Andijondagi №1 IT Academy uchun boshqaruv tizimi (CRM)",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/api/branding/logo",
    apple: "/api/branding/logo",
  },
};

export const viewport: Viewport = {
  themeColor: "#5E2CA5",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Passed to SessionProvider below so the very first client render already knows who's
  // logged in — without this, useSession() starts as unauthenticated on the client (while
  // server-rendered HTML used the real session), and anything gated on it (e.g. Sidebar's
  // role-based menu items) mismatches between server and client, triggering a hydration error.
  const session = await auth();

  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-gray-950`}>
        <SessionProvider session={session}>
          <SessionRoleSync />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
