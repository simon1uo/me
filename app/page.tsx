import { HomeLabTerminal } from 'app/components/home-lab-terminal'
import { HomeInsightsGrid } from 'app/components/home-insights-grid'
import { siteConfig } from 'app/config/site'

export default function Page() {
  return (
    <section className="atlas-stack">
      <HomeLabTerminal
        name={siteConfig.name}
        roleLine={siteConfig.roleLine}
        location={siteConfig.location}
        emails={siteConfig.emails}
        stackGroups={siteConfig.stackGroups}
        notes={siteConfig.notesPanel}
        stackSnapshot={siteConfig.stackSnapshot}
        copyLocale="en"
      />
      <HomeInsightsGrid />
    </section>
  )
}
