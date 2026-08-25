import { useState } from "react";
import { LangProvider } from "./LangContext";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Stats } from "./Stats";
import { WhatAwaits } from "./WhatAwaits";
import { WhyUs } from "./WhyUs";
import { Courses } from "./Courses";
import { Pricing } from "./Pricing";
import { Testimonials } from "./Testimonials";
import { StartupStudio } from "./StartupStudio";
import { Team } from "./Team";
import { FAQ } from "./FAQ";
import { LeadForm } from "./LeadForm";
import { Contact } from "./Contact";
import { Footer } from "./Footer";
import { StickyCTA } from "./StickyCTA";
export function LandingPage({ centerName, logo }) {
    const [selectedCourse, setSelectedCourse] = useState("");
    const scrollToForm = (courseName) => {
        if (courseName)
            setSelectedCourse(courseName);
        document.getElementById("ariza")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    return (<LangProvider>
      <div className="relative min-h-screen">
        {/* Fixed (non-scrolling) brand gradient — every section below is transparent
            and lets this show through, so the whole page reads as one surface. */}
        <div aria-hidden="true" className="landing-page-bg fixed inset-0 -z-10 pointer-events-none"/>
        <Header centerName={centerName} logo={logo}/>
        <main>
          <Hero />
          <Stats />
          <WhatAwaits />
          <WhyUs />
          <Courses onSelect={scrollToForm}/>
          <Pricing onSelect={scrollToForm}/>
          <Testimonials />
          <StartupStudio onSelect={() => scrollToForm()}/>
          <Team />
          <FAQ />
          <LeadForm selectedCourse={selectedCourse}/>
          <Contact />
        </main>
        <Footer centerName={centerName} logo={logo}/>
        <StickyCTA />
      </div>
    </LangProvider>);
}
