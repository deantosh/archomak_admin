import Image from 'next/image'

type AuthShellProps = {
  children: React.ReactNode
}

const highlights = [
  'Unified operations view',
  'Staff-only access',
  'Built for reliability',
]

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-border px-8 py-10 lg:flex lg:flex-col lg:justify-between xl:px-12">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_4%,transparent),transparent_28%,transparent)]" />
          <div className="relative z-10">
            <div className="mb-10 flex items-center gap-4">
              <div>
                <Image
                  src="/logo.png"
                  alt="Archomak logo"
                  width={180}
                  height={180}
                  priority
                  className="w-45"
                  style={{ height: 'auto' }}
                />
                <p className="text-sm text-muted-foreground">
                  Operational intelligence
                </p>
              </div>
            </div>

            <div className="max-w-xl space-y-5">
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Internal
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground xl:text-5xl">
                Operations control for Archomak teams.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Manage products, monitor health, and coordinate workflows from one place.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight}
                  className="rounded-3xl border border-border bg-card/50 p-5 backdrop-blur"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-foreground">
                    0{index + 1}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-4 lg:hidden">
              <div>
                <Image
                  src="/logo.png"
                  alt="Archomak logo"
                  width={180}
                  height={180}
                  priority
                  className="w-45"
                  style={{ height: 'auto' }}
                />
                <p className="text-sm text-muted-foreground">
                  Operational intelligence
                </p>
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}
