export default function NotFound() {
  return (
    <section className="atlas-panel p-6">
      <p className="atlas-label">404</p>
      <h1 className="mt-2 text-3xl uppercase tracking-[0.08em] text-[var(--atlas-accent)]">
        Page Not Found
      </h1>
      <p className="mt-4 text-sm text-[var(--atlas-muted)]">
        The requested route does not exist in this archive.
      </p>
    </section>
  )
}
