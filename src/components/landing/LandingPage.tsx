"use client";

import { useState, useEffect } from "react";
import { LangProvider } from "./LangContext";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Stats } from "./Stats";
import { WhatAwaits } from "./WhatAwaits";
import { WhyUs } from "./WhyUs";
import { Courses } from "./Courses";
import { Testimonials } from "./Testimonials";
import { StartupStudio } from "./StartupStudio";
import { Partners } from "./Partners";
import { Team } from "./Team";
import { LeadForm } from "./LeadForm";
import { Contact } from "./Contact";
import { Footer } from "./Footer";
import { StickyCTA } from "./StickyCTA";
import { useSearchParams } from "next/navigation";

export function LandingPage({ centerName, logo }: { centerName: string; logo: string }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const course = searchParams.get("course");
    if (course) {
      setSelectedCourse(course);
      document.getElementById("ariza")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  return (
    <LangProvider>
      <div className="relative min-h-screen">
        {/* Fixed (non-scrolling) brand gradient — every section below is transparent
            and lets this show through, so the whole page reads as one surface. */}
        <div aria-hidden="true" className="landing-page-bg fixed inset-0 -z-10 pointer-events-none" />
        <Header centerName={centerName} logo={logo} />
        <main>
          <Hero />
          <Stats />
          <WhatAwaits />
          <WhyUs />
          <Courses />
          <Testimonials />
          <StartupStudio />
          <Partners />
          <Team />
          <LeadForm selectedCourse={selectedCourse} />
          <Contact />
        </main>
        <Footer centerName={centerName} logo={logo} />
        <StickyCTA />
      </div>
    </LangProvider>
  );
}
