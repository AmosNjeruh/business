import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar />

      {/* Hero Section with Animated Background */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-12 lg:px-12 lg:pt-32 lg:pb-16">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 animate-pulse rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -right-20 top-40 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl delay-1000" />
          <div className="absolute bottom-20 left-1/2 h-96 w-96 -translate-x-1/2 animate-pulse rounded-full bg-indigo-500/20 blur-3xl delay-2000" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute h-1 w-1 rounded-full bg-emerald-400/40 animate-pulse`}
              style={{
                left: `${10 + (i * 7.5)}%`,
                top: `${15 + (i % 4) * 25}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + (i % 3) * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 opacity-10" style={{
          backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur transition-all hover:scale-105 hover:border-emerald-400/40">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Built on Trend360 · Trusted by agencies worldwide
          </div>
          <h1 className="mb-6 animate-fade-in-up text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your command center for
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
              multi-brand growth
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl animate-fade-in-up text-lg text-slate-300 sm:text-xl delay-100">
            Orchestrate every brand, campaign, and partner relationship from a single dashboard. 
            The Business Suite empowers agencies to scale operations, optimize performance, and drive 
            measurable results across their entire portfolio.
          </p>
          <div className="flex animate-fade-in-up flex-col items-center justify-center gap-4 sm:flex-row delay-200">
            <Link
              href="/admin/auth"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-slate-100 hover:shadow-2xl hover:shadow-emerald-500/40"
            >
              <span className="relative z-10">Launch Business Suite</span>
              <svg className="relative z-10 ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-20" />
            </Link>
            <Link
              href="/admin"
              className="group inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/50 px-6 py-3.5 text-base font-medium text-slate-200 backdrop-blur transition-all hover:scale-105 hover:border-emerald-400/60 hover:bg-slate-900/80"
            >
              Explore Dashboard
              <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
          </div>

          {/* Floating stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8">
            <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all hover:scale-105 hover:border-emerald-400/30 hover:bg-emerald-400/10">
              <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-emerald-400/20 blur-xl group-hover:bg-emerald-400/40 transition-all" />
              <div className="text-3xl font-bold text-emerald-400">7+</div>
              <div className="mt-1 text-xs text-slate-400">Brands Managed</div>
            </div>
            <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all hover:scale-105 hover:border-cyan-400/30 hover:bg-cyan-400/10">
              <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-cyan-400/20 blur-xl group-hover:bg-cyan-400/40 transition-all" />
              <div className="text-3xl font-bold text-cyan-400">132+</div>
              <div className="mt-1 text-xs text-slate-400">Active Partners</div>
            </div>
            <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all hover:scale-105 hover:border-indigo-400/30 hover:bg-indigo-400/10">
              <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-indigo-400/20 blur-xl group-hover:bg-indigo-400/40 transition-all" />
              <div className="text-3xl font-bold text-indigo-400">18+</div>
              <div className="mt-1 text-xs text-slate-400">Campaigns</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Separator */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <div className="flex gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-pulse delay-300" />
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400/60 animate-pulse delay-700" />
            </div>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-indigo-500/30" />
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        {/* Background Graphics */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 top-1/4 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" />
          <div className="absolute right-0 top-1/2 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl animate-pulse delay-1000" />
          <div className="absolute left-1/2 bottom-0 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl animate-pulse delay-2000" />
        </div>
        
        <div className="relative mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Everything you need to
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> scale operations</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Powerful tools designed for agencies managing multiple brands, campaigns, and partner networks
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Multi-Brand Management */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-8 backdrop-blur transition-all hover:scale-105 hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/10">
            {/* Decorative corner graphics */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-emerald-400/5 blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 transition-all group-hover:from-emerald-500/10 group-hover:to-transparent" />
            <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="relative mb-2 text-xl font-semibold text-white">Multi-Brand Portfolio</h3>
            <p className="relative text-slate-400">
              Centralize all your brands under one agency umbrella. Switch contexts instantly, manage permissions, 
              and maintain complete visibility across your entire portfolio.
            </p>
          </div>

          {/* Campaign Engine */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-8 backdrop-blur transition-all hover:scale-105 hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-500/10">
            {/* Decorative corner graphics */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:bg-cyan-500/20" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-cyan-400/5 blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 transition-all group-hover:from-cyan-500/10 group-hover:to-transparent" />
            <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="relative mb-2 text-xl font-semibold text-white">Campaign Engine</h3>
            <p className="relative text-slate-400">
              Launch, manage, and optimize campaigns end-to-end. From brief creation to payout approval, 
              streamline every step of your campaign lifecycle with intelligent workflows.
            </p>
          </div>

          {/* Partner Network */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-8 backdrop-blur transition-all hover:scale-105 hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-500/10">
            {/* Decorative corner graphics */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover:bg-indigo-500/20" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-indigo-400/5 blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 transition-all group-hover:from-indigo-500/10 group-hover:to-transparent" />
            <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="relative mb-2 text-xl font-semibold text-white">Partner Network</h3>
            <p className="relative text-slate-400">
              Discover, curate, and collaborate with top creators. Build your partner database, 
              track performance, and manage relationships all in one place.
            </p>
          </div>

          {/* Analytics & Insights */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-8 backdrop-blur transition-all hover:scale-105 hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 transition-all group-hover:from-emerald-500/10 group-hover:to-transparent" />
            <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="relative mb-2 text-xl font-semibold text-white">Advanced Analytics</h3>
            <p className="relative text-slate-400">
              Deep insights into funnels, cohorts, and performance metrics. Make data-driven decisions 
              with real-time dashboards and comprehensive reporting across all your brands.
            </p>
          </div>

          {/* Email Intelligence */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-8 backdrop-blur transition-all hover:scale-105 hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 transition-all group-hover:from-cyan-500/10 group-hover:to-transparent" />
            <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="relative mb-2 text-xl font-semibold text-white">Email Intelligence</h3>
            <p className="relative text-slate-400">
              Email-first communication hub with automated workflows. Keep partners and vendors 
              engaged with templated campaigns, invitations, and real-time notifications.
            </p>
          </div>

          {/* Workflow Automation */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-8 backdrop-blur transition-all hover:scale-105 hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 transition-all group-hover:from-indigo-500/10 group-hover:to-transparent" />
            <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="relative mb-2 text-xl font-semibold text-white">Smart Approvals</h3>
            <p className="relative text-slate-400">
              Streamlined application and work approval workflows. Review submissions, approve payments, 
              and protect your budget with intelligent validation and automated processes.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Separator */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex items-center justify-center py-6">
          <div className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-emerald-500/20 via-cyan-500/20 via-indigo-500/20 to-transparent" />
        </div>
      </div>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            How it works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            From brand setup to campaign optimization, we've streamlined every step
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {[
            { num: 1, title: "Add Your Brands", desc: "Create and configure multiple brand profiles under your agency account", color: "emerald" },
            { num: 2, title: "Launch Campaigns", desc: "Create campaigns, set budgets, and define objectives for each brand", color: "cyan" },
            { num: 3, title: "Curate Partners", desc: "Discover creators, send invitations, and build your partner network", color: "indigo" },
            { num: 4, title: "Optimize & Scale", desc: "Analyze performance, approve work, and scale successful campaigns", color: "emerald" },
          ].map((step, idx) => (
            <div key={step.num} className="group text-center transition-all hover:scale-105">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-${step.color}-400/20 to-${step.color}-600/20 text-2xl font-bold text-${step.color}-400 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-${step.color}-500/30`}>
                {step.num}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.desc}</p>
              {idx < 3 && (
                <div className="hidden lg:block">
                  <div className={`mx-auto mt-4 h-0.5 w-full bg-gradient-to-r from-${step.color}-400/50 to-transparent`} />
                  <svg className={`mx-auto mt-2 h-6 w-6 text-${step.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Visual Separator */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <div className="flex gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-pulse delay-300" />
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400/60 animate-pulse delay-700" />
            </div>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-indigo-500/30" />
          </div>
        </div>
      </div>

      {/* Dashboard Preview Section */}
      <section id="dashboard" className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        {/* Gradient Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>
        
        <div className="relative mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            See it in action
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            A unified dashboard that brings all your operations together
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-emerald-600/20 transition-all hover:scale-[1.02] hover:shadow-emerald-600/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-100">Business Suite Dashboard</span>
              <span className="text-xs text-slate-500">/admin</span>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Live Data
            </span>
          </div>

          <div className="relative grid gap-6 p-6 sm:grid-cols-2 lg:p-8">
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:border-emerald-400/30">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Portfolio Overview</p>
                <p className="mb-1 text-3xl font-bold text-white">18</p>
                <p className="text-sm text-emerald-300">Active campaigns across 7 brands</p>
                <div className="mt-4 h-16 rounded-lg bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-indigo-500/10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 transition-all hover:scale-105 hover:border-emerald-400/50">
                  <p className="text-xs text-emerald-200">Brands</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-100">7</p>
                  <p className="mt-1 text-[10px] text-emerald-200/80">Managed centrally</p>
                </div>
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4 transition-all hover:scale-105 hover:border-cyan-400/50">
                  <p className="text-xs text-cyan-200">Partners</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-100">132</p>
                  <p className="mt-1 text-[10px] text-cyan-200/80">Active network</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5 transition-all hover:border-indigo-400/50">
                <p className="mb-3 text-xs font-medium text-indigo-200">Action Required</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2 transition-all hover:bg-slate-950/80">
                    <span className="text-sm text-slate-100">9 applications pending</span>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-[10px] text-indigo-100">Review</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2 transition-all hover:bg-slate-950/80">
                    <span className="text-sm text-slate-100">4 work submissions</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-100">Approve</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:border-white/20">
                <p className="mb-2 text-xs font-medium text-slate-300">Email Intelligence</p>
                <p className="text-sm text-slate-200">
                  Automated communication threads keep partners engaged and informed throughout the campaign lifecycle.
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Templates & workflows</span>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-200">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Separator */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex items-center justify-center py-6">
          <div className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-emerald-500/20 via-cyan-500/20 via-indigo-500/20 to-transparent" />
        </div>
      </div>

      {/* Benefits Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        {/* Decorative Lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        
        <div className="relative mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Why agencies choose us
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Scale Without Limits", desc: "Manage unlimited brands and campaigns from a single dashboard. No more switching between tools or losing context.", icon: "📈" },
            { title: "Data-Driven Decisions", desc: "Real-time analytics and insights help you optimize campaigns, identify top performers, and allocate budget intelligently.", icon: "📊" },
            { title: "Streamlined Workflows", desc: "Automated approvals, email templates, and smart notifications reduce manual work and accelerate campaign execution.", icon: "⚡" },
            { title: "Partner Network", desc: "Build and maintain relationships with creators. Track performance, manage commissions, and grow your network.", icon: "🤝" },
            { title: "Team Collaboration", desc: "Role-based access control ensures the right people have the right permissions. Invite team members and delegate confidently.", icon: "👥" },
            { title: "Budget Protection", desc: "Smart approval workflows and balance management protect your spend while ensuring partners get paid on time.", icon: "💰" },
          ].map((benefit, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl border border-white/10 bg-slate-900/30 p-6 backdrop-blur transition-all hover:scale-105 hover:border-emerald-400/30 hover:bg-slate-900/50 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              {/* Decorative glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/0 to-transparent opacity-0 transition-opacity group-hover:opacity-10" />
              <div className="relative mb-3 text-3xl transition-transform group-hover:scale-110">{benefit.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-white">{benefit.title}</h3>
              <p className="text-slate-400">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Separator */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <div className="flex gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-pulse delay-300" />
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400/60 animate-pulse delay-700" />
            </div>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-indigo-500/30" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 p-12 text-center backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <div className="absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 animate-pulse rounded-full bg-indigo-500/20 blur-3xl delay-1000" />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-cyan-500/10 blur-3xl delay-500" />
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute h-1 w-1 rounded-full bg-white/30 animate-pulse`}
                style={{
                  left: `${15 + (i * 12)}%`,
                  top: `${20 + (i % 3) * 30}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${2 + (i % 2) * 0.5}s`
                }}
              />
            ))}
          </div>
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Ready to transform your agency operations?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-300">
              Join leading agencies using Trend360 Business Suite to scale their multi-brand operations
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/admin/auth"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-slate-100 hover:shadow-2xl hover:shadow-emerald-500/40"
              >
                <span className="relative z-10">Get Started Free</span>
                <svg className="relative z-10 ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-20" />
              </Link>
              <Link
                href="/admin"
                className="group inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-base font-medium text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/10"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
