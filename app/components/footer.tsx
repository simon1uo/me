export default function Footer() {
  return (
    <footer className="atlas-footer-index atlas-panel px-4 py-4 text-xs text-[var(--atlas-muted)] sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="uppercase tracking-[0.14em]">Simon Luo</p>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://github.com/simon1uo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--atlas-accent)]"
          >
            GitHub
          </a>
        </div>
      </div>
      <p className="mt-3">© {new Date().getFullYear()} MIT Licensed</p>
    </footer>
  )
}
