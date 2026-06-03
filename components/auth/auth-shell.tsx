import Image from 'next/image'

type AuthShellProps = {
  children: React.ReactNode
}

const highlights = [
  'Centralized operations visibility',
  'Secure staff-only administrative access',
  'Built for internal control and resilience',
]

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%),linear-gradient(135deg,#07111f_0%,#0b1628_45%,#101828_100%)] text-foreground">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 px-8 py-10 lg:flex lg:flex-col lg:justify-between xl:px-12">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_28%,transparent)]" />
          <div className="relative z-10">
            <div className="mb-10 flex items-center gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur">
                <Image src="/icon.svg" alt="Archomak logo" width={56} height={56} priority />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-white">Archomak</p>
                <p className="text-sm text-slate-300">
                  Operational Intelligence &amp; Digital Solutions
                </p>
              </div>
            </div>

            <div className="max-w-xl space-y-6">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-emerald-200">
                Internal Control Surface
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white xl:text-5xl">
                Secure operations for the teams running Archomak every day.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300 xl:text-lg">
                Sign in to manage products, monitor system health, review analytics, and
                coordinate internal workflows from one enterprise-grade dashboard.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                    0{index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-4 lg:hidden">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur">
                <Image src="/icon.svg" alt="Archomak logo" width={44} height={44} priority />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">Archomak</p>
                <p className="text-sm text-slate-300">
                  Operational Intelligence &amp; Digital Solutions
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
