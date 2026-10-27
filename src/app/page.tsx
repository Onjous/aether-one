import { Experience } from '@/components/experience/Experience'
import { CustomizeSection } from '@/components/sections/CustomizeSection'
import { ExplodedSection } from '@/components/sections/ExplodedSection'
import { FinaleSection } from '@/components/sections/FinaleSection'
import { Footer } from '@/components/sections/Footer'
import { FormSection } from '@/components/sections/FormSection'
import { Hero } from '@/components/sections/Hero'
import { SoundSection } from '@/components/sections/SoundSection'
import { SpecsSection } from '@/components/sections/SpecsSection'
import { Nav } from '@/components/ui/Nav'

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="tech fixed top-3 left-3 z-[60] -translate-y-24 rounded-full bg-soft px-4 py-2 text-obsidian focus:translate-y-0"
      >
        Skip to content
      </a>
      <Experience />
      <Nav />
      <main id="main">
        <Hero />
        <FormSection />
        <ExplodedSection />
        <SoundSection />
        <CustomizeSection />
        <SpecsSection />
        <FinaleSection />
      </main>
      <Footer />
    </>
  )
}
