import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|apple-icon|robots.txt|sitemap.xml|api/auth|api/telegram/webhook|api/cron|api/branding|api/public|apply|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
