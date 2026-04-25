export const metadata = {
  title: 'VIBES',
  description: 'A new space is under construction.',
}

export default function VibesPage() {
  return (
    <section className="atlas-stack">
      <div className="atlas-panel relative overflow-hidden p-8 sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: `
              radial-gradient(42rem 24rem at 10% 0%, color-mix(in srgb, var(--atlas-accent) 20%, transparent), transparent 58%),
              radial-gradient(38rem 26rem at 92% 100%, color-mix(in srgb, var(--atlas-accent) 12%, var(--atlas-bg) 8%), transparent 62%)
            `,
          }}
        />

        <div className="relative mx-auto flex min-h-[48vh] max-w-4xl items-center justify-center border border-[var(--atlas-border)] bg-[color-mix(in_srgb,var(--atlas-surface-strong)_84%,transparent)] px-6 text-center shadow-[0_20px_70px_var(--atlas-terminal-shadow)] backdrop-blur-sm">
          <div className="space-y-5">
            <p className="atlas-label">Vibes Transmission</p>
            <h1 className="font-mono text-3xl uppercase tracking-[0.24em] text-[var(--atlas-accent)] sm:text-5xl">
              COMING TO YOU SOON.
            </h1>
            <p className="text-sm tracking-[0.1em] text-[var(--atlas-muted)] sm:text-base">
              New experiments are calibrating.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
