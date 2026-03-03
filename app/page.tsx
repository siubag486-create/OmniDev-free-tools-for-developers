import HomeWrapper from "@/components/home-wrapper";
import TerminalHero from "@/components/hero/terminal-hero";
import ToolsLanding from "@/components/landing/tools-landing";

export default function Home() {
  return (
    <HomeWrapper>
      <section
        id="hero-section"
        style={{ height: "100vh", scrollSnapAlign: "start" }}
      >
        <TerminalHero />
      </section>
      <section
        id="tools-section"
        style={{ height: "100vh", scrollSnapAlign: "start" }}
      >
        <ToolsLanding />
      </section>
    </HomeWrapper>
  );
}
