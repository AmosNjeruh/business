import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/5 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-transparent backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 shadow-lg shadow-emerald-500/30">
              <span className="text-sm font-bold tracking-tight">T360</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide text-white">
                Trend360 Business Suite
              </span>
              <span className="text-xs text-slate-400">
                For agencies, serious vendors & growth teams
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-200 md:flex">
            <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur hover:border-emerald-400/60 hover:bg-emerald-400/10">
              Multi‑brand control
            </button>
            <button className="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur hover:border-cyan-400/60 hover:bg-cyan-400/10">
              Campaign engine
            </button>
            <button className="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur hover:border-indigo-400/60 hover:bg-indigo-400/10">
              Analytics & email
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/auth"
              className="hidden text-sm font-medium text-slate-200 hover:text-white md:inline"
            >
              Log in
            </Link>
            <Link
              href="/admin/auth"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/50 md:px-5 md:py-2 md:text-sm"
            >
              Launch Business Suite
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:pb-20 lg:pt-16">
        {/* Hero copy */}
        <section className="flex-1 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs font-medium text-emerald-300">
            Built on top of Trend360 · Designed for agencies
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Run every brand,
              <br />
              from brief to payout.
            </h1>
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Trend360 Business Suite is your control room for serious growth teams:
              manage multiple brands, curate partners, launch campaigns, and approve work
              with analytics that make every vendor signup and campaign decision obvious.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-3 sm:flex-row sm:items-center">
            <Link
              href="/admin/auth"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-slate-100 sm:px-6"
            >
              Get access to /admin
              <span className="ml-2 text-xs text-slate-500">Create vendor or partner account</span>
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/40 px-4 py-2 text-xs font-medium text-slate-100 hover:border-emerald-400/60 hover:bg-slate-900/70 sm:text-sm"
            >
              Preview dashboard experience
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-3 text-xs">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Multi‑brand
              </p>
              <p className="mt-1 font-semibold text-slate-50">
                One agency, dozens of brands
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-3 text-xs">
              <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                Partner engine
              </p>
              <p className="mt-1 font-semibold text-emerald-100">
                Browse, invite & curate partners
              </p>
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-3 text-xs sm:col-span-1 col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-cyan-300">
                Analytics + email
              </p>
              <p className="mt-1 font-semibold text-cyan-100">
                Funnels, cohorts & email workflows
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard preview panel */}
        <section className="flex-1">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-emerald-600/25">
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-slate-100">/admin</span>
                <span className="text-[10px] text-slate-500">Business Suite Dashboard</span>
              </div>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                Live vendor & partner data
              </span>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                  <p className="text-[11px] font-medium text-slate-400">Portfolio snapshot</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    18 active campaigns
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-300">
                    +7.4% week‑over‑week performance
                  </p>
                  <div className="mt-3 h-12 rounded-lg bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-indigo-500/10" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
                    <p className="text-emerald-200">Brands</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-100">7</p>
                    <p className="mt-0.5 text-[10px] text-emerald-200/80">
                      Centralized under your agency
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3">
                    <p className="text-cyan-200">Partners</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-100">132</p>
                    <p className="mt-0.5 text-[10px] text-cyan-200/80">
                      Curated for live & upcoming campaigns
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3 text-[11px]">
                  <p className="text-indigo-200">Approvals queue</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-2 py-1.5">
                      <span className="truncate text-xs text-slate-100">
                        9 applications · 3 brands
                      </span>
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-100">
                        Review now
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-2 py-1.5">
                      <span className="truncate text-xs text-slate-100">
                        4 work submissions awaiting approval
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-100">
                        Protect spend
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-[11px]">
                  <p className="text-slate-300">Email intelligence</p>
                  <p className="mt-1 text-xs text-slate-200">
                    Automated threads for every application, approval and payout – so your
                    partners and vendors never miss a beat.
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Templates: invitations, briefs, renewals</span>
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-200">
                      Email‑first
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

