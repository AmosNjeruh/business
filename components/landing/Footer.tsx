import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur">
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="relative h-10 w-auto">
                <Image
                  src="/logo.png"
                  alt="Trend360 Business Suite"
                  width={100}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Enterprise growth platform for agencies managing multi-brand operations.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-sm text-slate-400 transition-colors hover:text-emerald-400"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-sm text-slate-400 transition-colors hover:text-cyan-400"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#dashboard"
                  className="text-sm text-slate-400 transition-colors hover:text-indigo-400"
                >
                  Dashboard Preview
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Explore Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/auth"
                  className="text-sm text-slate-400 transition-colors hover:text-emerald-400"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/auth"
                  className="text-sm text-slate-400 transition-colors hover:text-cyan-400"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-slate-400 transition-colors hover:text-indigo-400"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Get Started</h3>
            <p className="text-sm text-slate-400">
              Ready to transform your agency operations?
            </p>
            <Link
              href="/admin/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/50"
            >
              Launch Business Suite
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            © {currentYear} Trend360. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
