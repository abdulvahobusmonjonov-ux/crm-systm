import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { LandingPage } from "@/components/landing/LandingPage";
import { COURSES, FAQ_ITEMS } from "@/components/landing/translations";

// Matches the pinned "Robocode IT Academy" location linked from the footer's Google Maps URL.
const MAP_LAT = 40.7468701;
const MAP_LNG = 72.3453432;

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://crm-oquv-markaz2.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Robocode IT Academy — Andijondagi birinchi IT akademiya",
  description:
    "Robocode IT Academy — Andijonda dasturlash, robototexnika, front-end, back-end va grafik dizayn bo'yicha amaliy kurslar. +3000 bitiruvchi, real loyihalar, kuchli karyera.",
  keywords: [
    "robocode",
    "robocode academy",
    "IT academy Andijon",
    "dasturlash kurslari Andijon",
    "robototexnika",
    "front-end",
    "back-end",
    "grafik dizayn",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "/",
    siteName: "Robocode IT Academy",
    title: "Robocode IT Academy — Andijondagi birinchi IT akademiya",
    description: "Dasturlash va robototexnika bo'yicha amaliy kurslar. Biz bilan doim birinchi bo'ling!",
    images: [{ url: "/api/branding/logo", width: 512, height: 512, alt: "Robocode IT Academy" }],
  },
  twitter: {
    card: "summary",
    title: "Robocode IT Academy — Andijondagi birinchi IT akademiya",
    description: "Dasturlash va robototexnika bo'yicha amaliy kurslar. Biz bilan doim birinchi bo'ling!",
    images: ["/api/branding/logo"],
  },
};

export default async function Home() {
  const settings = await db.setting
    .findMany({ where: { key: { in: ["brand_logo", "center_name"] } } })
    .catch(() => []);

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => (settingsMap[s.key] = s.value));
  const centerName = settingsMap["center_name"] || "Robocode IT Academy";
  const logo = settingsMap["brand_logo"] || "";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${BASE_URL}/#organization`,
    name: centerName,
    description: "Andijondagi IT akademiya — dasturlash va robototexnika bo'yicha amaliy kurslar.",
    url: BASE_URL,
    logo: `${BASE_URL}/api/branding/logo`,
    image: `${BASE_URL}/api/branding/logo`,
    telephone: ["+998998999005", "+998930759005"],
    address: { "@type": "PostalAddress", addressLocality: "Andijon", addressCountry: "UZ" },
    geo: { "@type": "GeoCoordinates", latitude: MAP_LAT, longitude: MAP_LNG },
    sameAs: ["https://instagram.com/aka.yakubov", "https://t.me/robocodee", "https://robocode.uz"],
  };

  const coursesJsonLd = COURSES.uz.map((c) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.name,
    description: c.modules.join(". "),
    provider: { "@type": "EducationalOrganization", name: centerName, sameAs: BASE_URL },
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.uz.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const jsonLd = [orgJsonLd, ...coursesJsonLd, faqJsonLd];

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Suspense fallback={null}>
        <LandingPage centerName={centerName} logo={logo} />
      </Suspense>
    </>
  );
}
