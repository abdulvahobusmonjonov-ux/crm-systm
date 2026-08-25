// src/app/page.tsx o'rnida. Next'da bu server komponenti bo'lib, markaz nomi va
// logotipini to'g'ridan-to'g'ri bazadan olardi; endi ular backend'ning ochiq
// `/api/branding` endpointidan keladi.
//
// Eslatma: eski sahifadagi JSON-LD/OpenGraph metama'lumotlari bu yerda yo'q —
// ular SSR'ga bog'liq edi. Landing SEO'si kerak bo'lsa, uni prerender qilish
// (yoki landing'ni alohida statik sahifada qoldirish) kerak bo'ladi.
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { apiFetch } from "@/lib/api";

const DEFAULT_NAME = "Robocode IT Academy";

export default function HomePage() {
  const [brand, setBrand] = useState({ name: DEFAULT_NAME, logo: "" });

  useEffect(() => {
    apiFetch("/api/branding")
      .then((r) => r.json())
      .then((d) => setBrand({ name: d.name || DEFAULT_NAME, logo: d.logo || "" }))
      .catch(() => {});
  }, []);

  return <LandingPage centerName={brand.name} logo={brand.logo} />;
}
